import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { addQuizRecordFirestore } from '@/app/lib/firebase';

// Zod schema for validating the quiz JSON structure
const maxInputLength = process.env.MAX_INPUT_LENGTH ? parseInt(process.env.MAX_INPUT_LENGTH) : 50;
const preparedJsonSchema = z
  .object({
    question: z
      .string()
      .min(1, { message: 'Question must not be empty.' })
      .max(maxInputLength, { message: `Question must be less than ${maxInputLength} characters.` }),
    type: z.enum(['quiz', 'matchingQuiz'], {
      message: 'Type must be either "quiz" or "matchingQuiz".',
    }),
    answers: z
      .array(
        z
          .string()
          .min(1, { message: 'Answer must not be empty.' })
          .max(maxInputLength, { message: `Answer must be less than ${maxInputLength} characters.` })
      )
      .min(1, { message: 'Answers array must contain at least one item.' }),
    keys: z
      .array(
        z
          .string()
          .min(1, { message: 'Key must not be empty.' })
          .max(maxInputLength, { message: `Key must be less than ${maxInputLength} characters.` })
      )
      .optional(),
    headers: z
      .array(
        z
          .string()
          .min(1, { message: 'Header must not be empty.' })
          .max(maxInputLength, { message: `Header must be less than ${maxInputLength} characters.` })
      )
      .optional(),
  })
  .refine(
    (data) => {
      if (data.type !== 'matchingQuiz') return true;
      return data.keys && data.keys.length === data.answers.length;
    },
    {
      message: 'Keys are required and must match the number of answers for matching quizzes.',
      path: ['keys'],
    }
  )
  .refine(
    (data) => {
      if (data.type !== 'matchingQuiz') return true;
      return data.headers && data.headers.length === 2;
    },
    {
      message: 'Headers are required and must contain exactly two items for matching quizzes.',
      path: ['headers'],
    }
  );

const nameSchema = z
  .string()
  .min(1, { message: 'Name must not be empty.' })
  .max(50, { message: 'Name must be less than 50 characters long.' });

const maxJsonFileSizeKB = process.env.MAX_JSON_FILE_SIZE_KB ? parseInt(process.env.MAX_JSON_FILE_SIZE_KB) : 128;

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const quizDataRaw = formData.get('quizData');
  const name = formData.get('name');

  const quizDataRawSize = typeof quizDataRaw === 'string' ? new TextEncoder().encode(quizDataRaw).length : 0;
  if (quizDataRawSize > maxJsonFileSizeKB * 1024) {
    return NextResponse.json({ error: `JSON file size exceeds the limit of ${maxJsonFileSizeKB} KB.` }, { status: 400 });
  }

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'Name is required and must be a string.' }, { status: 400 });
  }

  const nameValidation = nameSchema.safeParse(name);
  if (!nameValidation.success) {
    return NextResponse.json({ error: nameValidation.error.issues[0].message }, { status: 400 });
  }

  if (!quizDataRaw) {
    return NextResponse.json({ error: 'quizData is required.' }, { status: 400 });
  }

  if (typeof quizDataRaw !== 'string') {
    return NextResponse.json({ error: 'quizData must be a string.' }, { status: 400 });
  }

  let quizData;
  try {
    quizData = JSON.parse(quizDataRaw);
  } catch {
    return NextResponse.json({ error: 'quizData is not valid JSON.' }, { status: 400 });
  }

  const validatedJSON = preparedJsonSchema.safeParse(quizData);
  if (!validatedJSON.success) {
    return NextResponse.json(
      { error: validatedJSON.error.issues.map((issue) => issue.message) },
      { status: 400 }
    );
  }

  const { type, ...quizDataWithoutType } = validatedJSON.data;
  await addQuizRecordFirestore(type, nameValidation.data, JSON.stringify(quizDataWithoutType), undefined);

  return NextResponse.json({ status: 200 });
}

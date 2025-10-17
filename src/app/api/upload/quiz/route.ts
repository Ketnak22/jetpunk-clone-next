import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { v4 as uuidv4 } from 'uuid';

import fs from 'fs/promises';
import path from 'path';

import { addQuizRecordFirestore } from '@/app/lib/firebase';

// Zod schema for validating the quiz JSON structure
const preparedJsonSchema = z.object({
    question: z.string().min(1).max(50),
    type: z.enum(['quiz', 'matchingQuiz']),
    answers: z.array(z.string().min(1).max(50)),
    keys: z.array(z.string().min(1).max(50)).optional(),
});
const nameSchema = z.string().min(1, { message: "Name must not be empty"}).max(50, { message: "Name must be less than 50 characters long!"})

export async function POST(req: NextRequest) {
    // Parse FormData from the request
    const formData = await req.formData();
    const quizDataRaw = formData.get('quizData');
    const name = formData.get('name') as string | null;

    if (!name) {
        return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
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
    } catch (e) {
        return NextResponse.json({ error: 'quizData is not valid JSON.' }, { status: 400 });
    }

    const validatedJSON = preparedJsonSchema.safeParse(quizData);
    if (!validatedJSON.success) {
        return NextResponse.json({ error: 'Invalid quiz data.' }, { status: 400 });
    }

    if (validatedJSON.data.type === 'matchingQuiz') {
        if (!validatedJSON.data.keys || validatedJSON.data.keys.length !== validatedJSON.data.answers.length) {
            return NextResponse.json({ error: 'Keys are required and must match the number of answers for matching quizzes.' }, { status: 400 });
        }
    }
    // Save file and add record to the database
    const baseFilename = uuidv4();
    const jsonFilename = `${baseFilename}.json`;

    const filesDir = path.join(process.cwd(), 'files');
    await fs.mkdir(filesDir, { recursive: true });
    const filePath = path.join(filesDir, jsonFilename);

    await fs.writeFile(filePath, JSON.stringify(validatedJSON.data, null, 2), 'utf-8');

    await addQuizRecordFirestore(validatedJSON.data.type, name, baseFilename);

    return NextResponse.json({ status: 200 });
}
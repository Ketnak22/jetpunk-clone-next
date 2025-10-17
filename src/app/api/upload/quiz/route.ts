import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { v4 as uuidv4 } from 'uuid';

import fs from 'fs/promises';

import { addQuizRecord } from '@/app/lib/db';

// Zod schema for validating the quiz JSON structure
const preparedJsonSchema = z.object({
    question: z.string().min(1).max(50),
    type: z.enum(['quiz', 'matchingQuiz']),
    answers: z.array(z.string().min(1).max(50)),
    keys: z.array(z.string().min(1).max(50)).optional(),
});

export async function POST(req: NextRequest) {
    const body = await req.json();

    const validatedJSON = preparedJsonSchema.safeParse(body);
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

    // Add file to cloud storage


    addQuizRecord(validatedJSON.data.type, baseFilename);

    return NextResponse.json({ status: 200 });
}

// TODO: Baza mysql, generacja nazwy plików
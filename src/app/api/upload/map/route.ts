import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { JSDOM } from 'jsdom';
import createDOMPurify from 'dompurify';
import { addQuizRecordFirestore } from '@/app/lib/firebase';

// Set up DOMPurify with JSDOM
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// Zod schemas
const maxInputLength = process.env.MAX_INPUT_LENGTH ? parseInt(process.env.MAX_INPUT_LENGTH) : 50;
const nameSchema = z.string().min(1, { message: "Name must not be empty"}).max(maxInputLength, { message: `Name must be less than ${maxInputLength} characters long!`})
const jsonSchema = z.record(z.string(), z.string());

const maxSvgFileSizeKB = process.env.MAX_SVG_FILE_SIZE_KB ? parseInt(process.env.MAX_SVG_FILE_SIZE_KB) : 768;
const maxJsonFileSizeKB = process.env.MAX_JSON_FILE_SIZE_KB ? parseInt(process.env.MAX_JSON_FILE_SIZE_KB) : 128;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const svgFile = formData.get('svg') as File | null;
    const jsonFile = formData.get('json') as File | null;
    const nameData = formData.get('name') as string | null;

    if (!svgFile) {
      return NextResponse.json({ error: 'SVG file is required.' }, { status: 400 });
    }
    if (!jsonFile) {
      return NextResponse.json({ error: 'JSON file is required.' }, { status: 400 });
    }
    if (!nameData) {
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
    }

    if (svgFile.size > maxSvgFileSizeKB * 1024) {
      return NextResponse.json({ error: `SVG file size exceeds the limit of ${maxSvgFileSizeKB} KB.` }, { status: 400 });
    }

    if (jsonFile.size > maxJsonFileSizeKB * 1024) {
      return NextResponse.json({ error: `JSON file size exceeds the limit of ${maxJsonFileSizeKB} KB.` }, { status: 400 });
    }

    // Validate and sanitize SVG file
    if (svgFile.type !== 'image/svg+xml') {
      return NextResponse.json({ error: 'Uploaded file is not a valid SVG.' }, { status: 400 });
    }

    const svgText = await svgFile.text();
    const sanitizedSVG = DOMPurify.sanitize(svgText, { USE_PROFILES: { svg: true } });

    // Validate name
    const nameValidation = nameSchema.safeParse(nameData);
    if (!nameValidation.success) {
      return NextResponse.json({ error: nameValidation.error.issues[0].message }, { status: 400 });
    }

    // Parse JSON file
    const jsonText = await jsonFile.text();
    let parsedJSON: unknown;
    
    try {
      parsedJSON = JSON.parse(jsonText);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON file.' }, { status: 400 });
    }

    // Validate JSON file
    const jsonValidation = jsonSchema.safeParse(parsedJSON);
    if (!jsonValidation.success) {
      return NextResponse.json({ error: 'JSON file does not match the required schema.' }, { status: 400 });
    }

    // Add record to Firestore
    await addQuizRecordFirestore('map', nameData, JSON.stringify(jsonValidation.data), sanitizedSVG);

    return NextResponse.json({ status: 200 });
  } catch (error) {
    console.error('Error processing form data:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
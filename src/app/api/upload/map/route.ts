import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { JSDOM } from 'jsdom';
import createDOMPurify from 'dompurify';

// Set up DOMPurify with JSDOM
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// Zod schemas
const nameSchema = z.string().min(1, { message: "Name must not be empty"}).max(50, { message: "Name must be less than 50 characters long!"})
const jsonSchema = z.record(z.string(), z.string());

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

    // 3. Process the file data
    // const buffer = Buffer.from(await file.arrayBuffer());

    // You can now process the buffer (e.g., save it to a cloud storage like S3)
    console.log(`Received SVG file: ${svgFile.name}, size: ${svgFile.size} bytes`);
    console.log(`Received JSON file: ${jsonFile.name}, size: ${jsonFile.size} bytes`);
    console.log(`Name data: ${nameData}`);

    return NextResponse.json({ status: 200 });
  } catch (error) {
    console.error('Error processing form data:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
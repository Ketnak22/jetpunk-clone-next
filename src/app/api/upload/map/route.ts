import { NextRequest, NextResponse } from 'next/server';

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

    // 3. Process the file data
    // const buffer = Buffer.from(await file.arrayBuffer());

    // You can now process the buffer (e.g., save it to a cloud storage like S3)
    console.log(`Received SVG file: ${svgFile.name}, size: ${svgFile.size} bytes`);
    console.log(`Received JSON file: ${jsonFile.name}, size: ${jsonFile.size} bytes`);
    console.log(`Name data: ${nameData}`);

    return NextResponse.json({ message: 'File processed successfully' });
  } catch (error) {
    console.error('Error processing form data:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
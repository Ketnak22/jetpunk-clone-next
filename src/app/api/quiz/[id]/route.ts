import { NextResponse } from 'next/server';
import { getQuizById } from '@/app/lib/firebase';

export async function GET(_req: Request, context: any) {
  const params = await context?.params;
  const { id } = params ?? {};
  try {
    const raw = await getQuizById(id);
    if (!raw) return NextResponse.json({ message: 'Not found' }, { status: 404 });
    return NextResponse.json(raw);
  } catch (err) {
    console.error('API /api/quiz error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const authUser = getAuthUser(request.headers);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get('file') as File;
  const type = formData.get('type') as string; // 'logo' or 'signature'

  if (!file) return NextResponse.json({ error: 'File wajib diisi' }, { status: 400 });
  if (!type || !['logo', 'signature'].includes(type)) {
    return NextResponse.json({ error: 'Type harus logo atau signature' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;

  return NextResponse.json({ url: base64, type });
}

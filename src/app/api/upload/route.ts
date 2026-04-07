import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

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

  const ext = path.extname(file.name) || '.png';
  const filename = `${type}-${Date.now()}${ext}`;
  const dir = path.join(process.cwd(), 'public', 'uploads', type);

  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);

  const url = `/uploads/${type}/${filename}`;
  return NextResponse.json({ url });
}

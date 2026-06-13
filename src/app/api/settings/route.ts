import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const settings = await prisma.appSetting.findMany();
    const result: Record<string, string> = {};
    settings.forEach(s => { result[s.key] = s.value; });
    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/settings error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    // body = { key: string, value: string }
    const setting = await prisma.appSetting.upsert({
      where: { key: body.key },
      update: { value: body.value },
      create: { key: body.key, value: body.value },
    });
    return NextResponse.json(setting);
  } catch (error) {
    console.error('PUT /api/settings error:', error);
    return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 });
  }
}

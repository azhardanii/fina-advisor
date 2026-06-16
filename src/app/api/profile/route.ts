import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const setting = await prisma.appSetting.findUnique({
      where: { key: 'user_profile' }
    });

    if (setting) {
      return NextResponse.json(JSON.parse(setting.value));
    }
    
    return NextResponse.json({});
  } catch (error) {
    console.error('Failed to get user profile:', error);
    return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    
    await prisma.appSetting.upsert({
      where: { key: 'user_profile' },
      update: { value: JSON.stringify(body) },
      create: { key: 'user_profile', value: JSON.stringify(body) }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save user profile:', error);
    return NextResponse.json({ error: 'Failed to save user profile' }, { status: 500 });
  }
}

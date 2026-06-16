import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get('cursor');
    const take = 10;

    const messages = await prisma.chatMessage.findMany({
      take: take,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { createdAt: 'desc' }
    });

    // Return in chronological order for the client
    return NextResponse.json(messages.reverse());
  } catch (error) {
    console.error('Failed to fetch chat history:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await prisma.chatMessage.deleteMany({});
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete chat history:', error);
    return NextResponse.json({ error: 'Failed to clear history' }, { status: 500 });
  }
}

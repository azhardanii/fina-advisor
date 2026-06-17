import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const evaluations = await prisma.advisorEvaluation.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit 50 to prevent huge payloads
    });
    return NextResponse.json(evaluations);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      await prisma.advisorEvaluation.delete({ where: { id } });
    } else {
      // Delete old history (e.g., > 30 days old) to free up space
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      await prisma.advisorEvaluation.deleteMany({
        where: { createdAt: { lt: thirtyDaysAgo } }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

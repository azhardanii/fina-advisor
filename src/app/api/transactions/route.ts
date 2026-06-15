import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { date: 'desc' },
    });
    return NextResponse.json(transactions);
  } catch (error) {
    console.error('GET /api/transactions error:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Support bulk transactions (array)
    const txDataArray = Array.isArray(body) ? body : [body];

    const operations = [];
    for (const txData of txDataArray) {
      operations.push(
        prisma.transaction.create({
          data: {
            type: txData.type,
            amount: txData.amount,
            category: txData.category,
            note: txData.note || '',
            date: txData.date ? new Date(txData.date) : new Date(),
            walletId: txData.walletId,
          },
        })
      );

      const balanceChange = txData.type === 'income' ? txData.amount : -txData.amount;
      operations.push(
        prisma.wallet.update({
          where: { id: txData.walletId },
          data: { balance: { increment: balanceChange } },
        })
      );
    }

    const results = await prisma.$transaction(operations);
    const createdTransactions = results.filter((_, idx) => idx % 2 === 0);

    return NextResponse.json(createdTransactions, { status: 201 });
  } catch (error) {
    console.error('POST /api/transactions error:', error);
    return NextResponse.json({ error: 'Failed to create transaction', details: String(error) }, { status: 500 });
  }
}

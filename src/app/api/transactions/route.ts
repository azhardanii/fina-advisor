import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    const results = await prisma.$transaction(async (tx) => {
      const created = [];
      for (const txData of txDataArray) {
        const transaction = await tx.transaction.create({
          data: {
            type: txData.type,
            amount: txData.amount,
            category: txData.category,
            note: txData.note || '',
            date: txData.date ? new Date(txData.date) : new Date(),
            walletId: txData.walletId,
          },
        });

        // Update wallet balance
        const balanceChange = txData.type === 'income' ? txData.amount : -txData.amount;
        await tx.wallet.update({
          where: { id: txData.walletId },
          data: { balance: { increment: balanceChange } },
        });

        created.push(transaction);
      }
      return created;
    });

    return NextResponse.json(results, { status: 201 });
  } catch (error) {
    console.error('POST /api/transactions error:', error);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}

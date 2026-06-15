import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Get old transaction outside the transaction to avoid holding the lock
    const oldTx = await prisma.transaction.findUnique({ where: { id } });
    if (!oldTx) throw new Error('Transaction not found');

    const revertChange = oldTx.type === 'income' ? -oldTx.amount : oldTx.amount;
    const applyChange = body.type === 'income' ? body.amount : -body.amount;

    const result = await prisma.$transaction([
      // 1. Revert old balance
      prisma.wallet.update({
        where: { id: oldTx.walletId },
        data: { balance: { increment: revertChange } },
      }),
      // 2. Update transaction
      prisma.transaction.update({
        where: { id },
        data: {
          type: body.type,
          amount: body.amount,
          category: body.category,
          note: body.note || '',
          walletId: body.walletId,
          date: body.date ? new Date(body.date) : undefined,
        },
      }),
      // 3. Apply new balance
      prisma.wallet.update({
        where: { id: body.walletId },
        data: { balance: { increment: applyChange } },
      })
    ]);

    // result[1] is the updated transaction
    return NextResponse.json(result[1]);
  } catch (error) {
    console.error('PUT /api/transactions/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const oldTx = await prisma.transaction.findUnique({ where: { id } });
    if (!oldTx) throw new Error('Transaction not found');

    const revertChange = oldTx.type === 'income' ? -oldTx.amount : oldTx.amount;

    await prisma.$transaction([
      // 1. Revert balance
      prisma.wallet.update({
        where: { id: oldTx.walletId },
        data: { balance: { increment: revertChange } },
      }),
      // 2. Delete transaction
      prisma.transaction.delete({ where: { id } })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/transactions/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const result = await prisma.$transaction(async (tx) => {
      // Get old transaction to revert balance
      const oldTx = await tx.transaction.findUnique({ where: { id } });
      if (!oldTx) throw new Error('Transaction not found');

      // Revert old balance
      const revertChange = oldTx.type === 'income' ? -oldTx.amount : oldTx.amount;
      await tx.wallet.update({
        where: { id: oldTx.walletId },
        data: { balance: { increment: revertChange } },
      });

      // Update transaction
      const updated = await tx.transaction.update({
        where: { id },
        data: {
          type: body.type,
          amount: body.amount,
          category: body.category,
          note: body.note || '',
          walletId: body.walletId,
        },
      });

      // Apply new balance
      const applyChange = body.type === 'income' ? body.amount : -body.amount;
      await tx.wallet.update({
        where: { id: body.walletId },
        data: { balance: { increment: applyChange } },
      });

      return updated;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('PUT /api/transactions/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    await prisma.$transaction(async (tx) => {
      const oldTx = await tx.transaction.findUnique({ where: { id } });
      if (!oldTx) throw new Error('Transaction not found');

      // Revert balance
      const revertChange = oldTx.type === 'income' ? -oldTx.amount : oldTx.amount;
      await tx.wallet.update({
        where: { id: oldTx.walletId },
        data: { balance: { increment: revertChange } },
      });

      await tx.transaction.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/transactions/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
  }
}

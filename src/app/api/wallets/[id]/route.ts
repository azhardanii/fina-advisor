import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const wallet = await prisma.wallet.update({
      where: { id },
      data: {
        name: body.name,
        balance: body.balance,
        color: body.color,
        bankName: body.bankName ?? null,
        accountNumber: body.accountNumber ?? null,
        accountName: body.accountName ?? null,
        allocationGroup: body.allocationGroup ?? null,
        isPinned: body.isPinned !== undefined ? body.isPinned : undefined,
      },
    });
    return NextResponse.json(wallet);
  } catch (error) {
    console.error('PUT /api/wallets/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update wallet' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.wallet.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/wallets/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete wallet' }, { status: 500 });
  }
}

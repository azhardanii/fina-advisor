import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const wallets = await prisma.wallet.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(wallets);
  } catch (error) {
    console.error('GET /api/wallets error:', error);
    return NextResponse.json({ error: 'Failed to fetch wallets' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const wallet = await prisma.wallet.create({
      data: {
        name: body.name,
        balance: body.balance || 0,
        color: body.color || 'bg-teal-500',
        bankName: body.bankName || null,
        accountNumber: body.accountNumber || null,
        accountName: body.accountName || null,
        allocationGroup: body.allocationGroup || null,
      },
    });
    return NextResponse.json(wallet, { status: 201 });
  } catch (error) {
    console.error('POST /api/wallets error:', error);
    return NextResponse.json({ error: 'Failed to create wallet' }, { status: 500 });
  }
}

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
    const balance = body.balance || 0;
    
    // Gunakan transaction untuk memastikan wallet dan saldo awalnya tersimpan
    const wallet = await prisma.$transaction(async (tx: any) => {
      const newWallet = await tx.wallet.create({
        data: {
          name: body.name,
          balance: balance,
          color: body.color || 'bg-teal-500',
          bankName: body.bankName || null,
          accountNumber: body.accountNumber || null,
          accountName: body.accountName || null,
          allocationGroup: body.allocationGroup || null,
        },
      });

      if (balance > 0) {
        await tx.transaction.create({
          data: {
            type: 'income',
            amount: balance,
            category: 'Saldo Awal',
            note: 'Saldo awal pembuatan dompet',
            walletId: newWallet.id,
            date: new Date(),
          }
        });
      }

      return newWallet;
    });

    return NextResponse.json(wallet, { status: 201 });
  } catch (error) {
    console.error('POST /api/wallets error:', error);
    return NextResponse.json({ error: 'Failed to create wallet' }, { status: 500 });
  }
}

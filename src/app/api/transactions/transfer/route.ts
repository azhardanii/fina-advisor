import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { sourceWalletId, destWalletId, amount, date, note } = await req.json();

    if (!sourceWalletId || !destWalletId || !amount) {
      return NextResponse.json({ error: "Source wallet, destination wallet, and amount are required" }, { status: 400 });
    }

    if (sourceWalletId === destWalletId) {
      return NextResponse.json({ error: "Source and destination wallets cannot be the same" }, { status: 400 });
    }

    if (amount <= 0) {
      return NextResponse.json({ error: "Amount must be greater than zero" }, { status: 400 });
    }

    const txDate = date ? new Date(date) : new Date();

    const [sourceTx, destTx, sourceWallet, destWallet] = await prisma.$transaction([
      // 1. Create Expense Transaction from Source
      prisma.transaction.create({
        data: {
          type: 'expense',
          amount: Number(amount),
          category: 'Transfer Keluar',
          note: note || 'Transfer dana antar dompet',
          date: txDate,
          walletId: sourceWalletId,
        }
      }),
      // 2. Create Income Transaction to Destination
      prisma.transaction.create({
        data: {
          type: 'income',
          amount: Number(amount),
          category: 'Transfer Masuk',
          note: note || 'Transfer dana antar dompet',
          date: txDate,
          walletId: destWalletId,
        }
      }),
      // 3. Deduct from Source Wallet
      prisma.wallet.update({
        where: { id: sourceWalletId },
        data: { balance: { decrement: Number(amount) } }
      }),
      // 4. Add to Destination Wallet
      prisma.wallet.update({
        where: { id: destWalletId },
        data: { balance: { increment: Number(amount) } }
      })
    ]);

    return NextResponse.json({ success: true, sourceTx, destTx });
  } catch (error: any) {
    console.error("Transfer transaction error:", error);
    return NextResponse.json({ error: error.message || "Failed to process transfer" }, { status: 500 });
  }
}

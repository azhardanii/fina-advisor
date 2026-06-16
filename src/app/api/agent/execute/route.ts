import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { actionType, data } = await req.json();

    if (!actionType) {
      return NextResponse.json({ error: 'Missing actionType' }, { status: 400 });
    }

    switch (actionType) {
      case 'DELETE_TRANSACTIONS': {
        let whereClause: any = {};
        if (data.type && data.type !== 'all') {
          whereClause.type = data.type;
        }
        if (data.category) {
          whereClause.category = data.category;
        }
        if (data.searchNote) {
          whereClause.note = { contains: data.searchNote, mode: 'insensitive' };
        }
        if (data.id) {
          whereClause.id = data.id;
        }
        
        const finalWhere = Object.keys(whereClause).length > 0 ? whereClause : undefined;

        if (!finalWhere && data.deleteAll !== true) {
           throw new Error("Pencegahan otomatis: Dilarang menghapus seluruh transaksi! Harap berikan data 'searchNote', 'category', atau set 'deleteAll': true.");
        }
        
        const txsToDelete = await prisma.transaction.findMany({ where: finalWhere });
        
        const walletDiffs: Record<string, number> = {};
        for (const tx of txsToDelete) {
          const diff = tx.type === 'expense' ? tx.amount : -tx.amount;
          walletDiffs[tx.walletId] = (walletDiffs[tx.walletId] || 0) + diff;
        }

        const operations: any[] = [];
        for (const [walletId, diff] of Object.entries(walletDiffs)) {
          if (diff !== 0) {
            operations.push(
              prisma.wallet.update({
                where: { id: walletId },
                data: { balance: { increment: diff } }
              })
            );
          }
        }
        operations.push(
          prisma.transaction.deleteMany({ where: finalWhere })
        );

        await prisma.$transaction(operations);
        
        return NextResponse.json({ success: true, message: `Berhasil menghapus ${txsToDelete.length} transaksi beserta rollback saldo dompet.` });
      }

      case 'UPDATE_TRANSACTIONS': {
        // data.searchNote matches the note loosely, data.updates contains the fields to update
        if (!data.updates) throw new Error("Tidak ada data pembaruan (updates) yang diberikan.");
        
        let whereClause: any = {};
        if (data.searchNote) {
          whereClause.note = { contains: data.searchNote, mode: 'insensitive' };
        }
        if (data.oldCategory) {
          whereClause.category = data.oldCategory;
        }

        const txsToUpdate = await prisma.transaction.findMany({ where: whereClause });
        if (txsToUpdate.length === 0) {
          return NextResponse.json({ error: 'Tidak menemukan transaksi yang cocok untuk diupdate.' }, { status: 404 });
        }

        await prisma.transaction.updateMany({
          where: whereClause,
          data: data.updates
        });

        return NextResponse.json({ success: true, message: `Berhasil mengupdate ${txsToUpdate.length} transaksi.` });
      }

      case 'UPDATE_PROFILE': {
        // data contains partial profile updates like { financialGoal: "Umroh" }
        const currentSetting = await prisma.appSetting.findUnique({ where: { key: 'user_profile' } });
        let profile = {};
        if (currentSetting) {
          try { profile = JSON.parse(currentSetting.value); } catch (e) {}
        }
        
        const newProfile = { ...profile, ...data };
        
        await prisma.appSetting.upsert({
          where: { key: 'user_profile' },
          update: { value: JSON.stringify(newProfile) },
          create: { key: 'user_profile', value: JSON.stringify(newProfile) }
        });
        
        return NextResponse.json({ success: true, message: 'Profil berhasil diperbarui.', profile: newProfile });
      }

      case 'UPDATE_WALLET': {
        if (!data.walletId || data.balance === undefined) throw new Error("Wallet ID dan balance baru diperlukan");
        const newBalance = Number(data.balance);
        
        const currentWallet = await prisma.wallet.findUnique({ where: { id: data.walletId } });
        if (!currentWallet) throw new Error("Wallet tidak ditemukan");

        const difference = newBalance - currentWallet.balance;
        
        const operations: any[] = [];

        // Jika ada selisih, buat transaksi penyesuaian
        if (difference !== 0) {
          operations.push(
            prisma.transaction.create({
              data: {
                type: difference > 0 ? 'income' : 'expense',
                amount: Math.abs(difference),
                category: 'Penyesuaian Saldo',
                note: 'Penyesuaian saldo otomatis oleh FINA (Auditor)',
                date: new Date(),
                walletId: data.walletId,
              }
            })
          );
        }

        operations.push(
          prisma.wallet.update({
            where: { id: data.walletId },
            data: { balance: newBalance }
          })
        );

        await prisma.$transaction(operations);

        return NextResponse.json({ success: true, message: `Saldo dompet ${currentWallet.name} berhasil disesuaikan menjadi ${newBalance}.` });
      }

      case 'CREATE_WALLET': {
        if (!data.name) throw new Error("Nama dompet diperlukan");
        const balance = Number(data.balance) || 0;
        
        const wallet = await prisma.$transaction(async (tx: any) => {
          const newWallet = await tx.wallet.create({
            data: {
              name: data.name,
              balance: balance,
              color: data.color || 'bg-teal-500',
              bankName: data.bankName || null,
            }
          });

          if (balance > 0) {
            await tx.transaction.create({
              data: {
                type: 'income',
                amount: balance,
                category: 'Saldo Awal',
                note: 'Saldo awal pembuatan dompet oleh FINA',
                walletId: newWallet.id,
                date: new Date(),
              }
            });
          }
          return newWallet;
        });
        
        return NextResponse.json({ success: true, message: 'Dompet berhasil dibuat.', wallet });
      }

      default:
        return NextResponse.json({ error: 'Action type not supported' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Agent Execute API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

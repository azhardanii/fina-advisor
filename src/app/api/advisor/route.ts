import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { prisma } from '@/lib/prisma';

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { dateRange, customStart, customEnd } = body;

    // Ambil data user
    const wallets = await prisma.wallet.findMany();

    // Filter transaksi berdasarkan rentang tanggal
    let txQuery: any = {};
    if (dateRange === 'hari_ini') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      txQuery.date = { gte: today };
    } else if (dateRange === 'bulan_ini') {
      const start = new Date();
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      txQuery.date = { gte: start };
    } else if (dateRange === 'tahun_ini') {
      const start = new Date(new Date().getFullYear(), 0, 1);
      start.setHours(0, 0, 0, 0);
      txQuery.date = { gte: start };
    } else if (dateRange === 'custom' && customStart && customEnd) {
      const start = new Date(customStart);
      start.setHours(0, 0, 0, 0);
      const end = new Date(customEnd);
      end.setHours(23, 59, 59, 999);
      txQuery.date = { gte: start, lte: end };
    }

    const transactions = await prisma.transaction.findMany({
      where: txQuery,
      orderBy: { date: 'desc' }
    });

    const mappedTransactions = transactions.map((t: any) => ({
      date: new Date(t.date).toLocaleDateString('id-ID'),
      type: t.type,
      amount: t.amount,
      category: t.category,
      note: t.note
    }));

    const totalBalance = wallets.reduce((sum: number, w: any) => sum + w.balance, 0);

    const systemInstruction = `Kamu adalah Financial Advisor Pribadi kelas dunia.
Tugas Kamu adalah mengevaluasi kondisi keuangan user berdasarkan data transaksi dalam rentang tanggal tertentu.

Data Dompet Saat Ini: ${JSON.stringify(wallets.map((w: any) => ({ name: w.name, balance: w.balance })))}
Total Saldo Aktif: ${totalBalance}

Riwayat Transaksi (Periode: ${dateRange}):
${JSON.stringify(mappedTransactions)}

WAJIB MENGEMBALIKAN FORMAT JSON (tanpa markdown blok tambahan) DENGAN STRUKTUR BERIKUT:
{
  "advice": "Berisi artikel saran markdown (Gunakan header, bold, list, dan emoji).",
  "chartData": {
    "pieData": [
      {"name": "Makanan", "value": 150000},
      {"name": "Transportasi", "value": 50000}
    ],
    "barData": [
      {"name": "Pemasukan", "amount": 2000000},
      {"name": "Pengeluaran", "amount": 500000}
    ]
  }
}
Pastikan pieData berisi ringkasan total pengeluaran ('expense') per kategori.
Pastikan barData berisi perbandingan total 'income' vs 'expense' dari transaksi di atas.`;

    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [{ role: 'user', parts: [{ text: "Tolong berikan evaluasi keuangan saya berdasarkan data transaksi yang diberikan di instruksi sistem." }] }],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json"
      }
    });

    const aiReplyText = response.text || '{}';
    const parsedReply = JSON.parse(aiReplyText);

    const adviceText = parsedReply.advice || "Gagal mendapatkan saran.";
    const chartDataObj = parsedReply.chartData || null;
    const chartDataStr = chartDataObj ? JSON.stringify(chartDataObj) : null;

    // Simpan ke database riwayat
    const evaluation = await prisma.advisorEvaluation.create({
      data: {
        dateRange,
        customStart: customStart ? new Date(customStart) : null,
        customEnd: customEnd ? new Date(customEnd) : null,
        advice: adviceText,
        chartData: chartDataStr
      }
    });

    return NextResponse.json(evaluation);

  } catch (error: any) {
    console.error('Advisor API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const oldCategory = await prisma.category.findUnique({ where: { id } });
    if (!oldCategory) {
      return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 404 });
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: body.name,
        type: body.type,
        color: body.color,
      },
    });

    if (oldCategory.name !== body.name) {
      await prisma.transaction.updateMany({
        where: { category: oldCategory.name },
        data: { category: body.name },
      });
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('PUT /api/categories/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/categories/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getVerifiedProfile } from '@/app/actions/profile';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const result = await getVerifiedProfile(id);

    if (result.isDraft && !result.canViewDraft) {
      return NextResponse.json(
        { error: 'Profil belum tersedia', isDraft: true },
        { status: 404 }
      );
    }

    if (!result.profile) {
      return NextResponse.json(
        { error: 'Profil tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      profile: result.profile,
      portfolios: result.portfolios,
      reviews: result.reviews,
      isDraft: result.isDraft,
      canViewDraft: result.canViewDraft,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat memproses data profil' },
      { status: 500 }
    );
  }
}

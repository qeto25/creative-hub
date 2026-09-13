import { NextRequest, NextResponse } from 'next/server';
import { getVerifiedProfile } from '@/app/actions/profile';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const result = await getVerifiedProfile(params.id);

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
}

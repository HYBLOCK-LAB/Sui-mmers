import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const TABLE_NAME = 'deployments';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const walletAddress = searchParams.get('walletAddress');

  if (!walletAddress) {
    return NextResponse.json({ error: 'walletAddress 파라미터가 필요합니다.' }, { status: 400 });
  }

  try {
    console.log('[GET /api/deployments] 요청 수신', { walletAddress });
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('wallet_address', walletAddress)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[GET /api/deployments] Supabase 오류', error);
      return NextResponse.json({ error: '패키지 정보를 불러오지 못했습니다.' }, { status: 500 });
    }

    console.log('[GET /api/deployments] 조회 결과', { walletAddress, packageId: data?.package_id });

    return NextResponse.json({
      packageId: data?.package_id ?? null,
      record: data ?? null,
    });
  } catch (error) {
    console.error('[GET /api/deployments] 서버 오류', error);
    return NextResponse.json({ error: '서버에서 예기치 못한 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { walletAddress, packageId, lessonSlug } = await request.json().catch(() => ({}));

  if (!walletAddress || !packageId) {
    return NextResponse.json({ error: 'walletAddress 와 packageId 는 필수 값입니다.' }, { status: 400 });
  }

  try {
    console.log('[POST /api/deployments] 저장 요청', { walletAddress, packageId, lessonSlug });
    const supabase = createSupabaseServerClient();

    const payload = {
      wallet_address: walletAddress,
      package_id: packageId,
      lesson_slug: lessonSlug ?? null,
    };

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .upsert(payload, { onConflict: 'wallet_address' })
      .select()
      .maybeSingle();

    if (error) {
      console.error('[POST /api/deployments] Supabase 오류', error);
      return NextResponse.json({ error: '패키지 정보를 저장하지 못했습니다.' }, { status: 500 });
    }

    console.log('[POST /api/deployments] 저장 완료', { walletAddress, packageId: data?.package_id });

    return NextResponse.json({
      success: true,
      record: data,
    });
  } catch (error) {
    console.error('[POST /api/deployments] 서버 오류', error);
    return NextResponse.json({ error: '서버에서 예기치 못한 오류가 발생했습니다.' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const TABLE_NAME = 'deployments';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const walletAddress = searchParams.get('walletAddress');

  if (!walletAddress) {
    return NextResponse.json({ error: 'walletAddress parameter is required.' }, { status: 400 });
  }

  try {
    console.log('[GET /api/deployments] request received', { walletAddress });
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('wallet_address', walletAddress)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('[GET /api/deployments] Supabase error', error);
      return NextResponse.json({ error: 'Failed to load deployment history.' }, { status: 500 });
    }

    const deployments = data ?? [];

    return NextResponse.json({
      packageId: deployments[0]?.package_id ?? null,
      records: deployments,
    });
  } catch (error) {
    console.error('[GET /api/deployments] unexpected server error', error);
    return NextResponse.json({ error: 'Unexpected server error occurred.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { walletAddress, packageId, lessonSlug } = await request.json().catch(() => ({}));

  if (!walletAddress || !packageId) {
    return NextResponse.json({ error: 'walletAddress and packageId are required.' }, { status: 400 });
  }

  try {
    console.log('[POST /api/deployments] save request', { walletAddress, packageId, lessonSlug });
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
      console.error('[POST /api/deployments] Supabase error', error);
      return NextResponse.json({ error: 'Failed to persist package information.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      record: data,
    });
  } catch (error) {
    console.error('[POST /api/deployments] unexpected server error', error);
    return NextResponse.json({ error: 'Unexpected server error occurred.' }, { status: 500 });
  }
}

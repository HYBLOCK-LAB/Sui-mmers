import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;

export const createSupabaseBrowserClient = () => {
  if (!supabaseUrl || !anonKey) {
    throw new Error('Supabase 클라이언트 초기화를 위한 환경 변수가 부족합니다.');
  }

  return createClient(supabaseUrl, anonKey, {
    auth: {
      persistSession: false,
    },
  });
};

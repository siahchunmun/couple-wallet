import { createClient } from "@/lib/supabase/server";

export async function getWalletCategories(
  walletId: string
) {
  const supabase = await createClient();

  const {
    data,
    error,
  } = await supabase
    .from("categories")
    .select(`
      id,
      wallet_id,
      name_en,
      name_zh,
      icon_key,
      category_type,
      is_system,
      created_by
    `)
    .or(
      `is_system.eq.true,wallet_id.eq.${walletId}`
    )
    .order("is_system", {
      ascending: false,
    })
    .order("name_en");

  if (error) {
    throw new Error(
      error.message
    );
  }

  return data ?? [];
}
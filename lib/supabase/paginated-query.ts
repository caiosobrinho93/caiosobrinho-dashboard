import type { SupabaseClient } from "@supabase/supabase-js";

/** Cursor pagination also works when the server caps responses below our page size. */
export async function fetchUserRows(
  client: SupabaseClient,
  table: string,
  userId: string,
): Promise<Record<string, unknown>[]> {
  const rows: Record<string, unknown>[] = [];
  let cursor: string | null = null;
  for (;;) {
    let query = client.from(table).select("*").eq("user_id", userId)
      .order("id", { ascending: true }).limit(500);
    if (cursor) query = query.gt("id", cursor);
    const { data, error } = await query;
    if (error) throw error;
    if (!data) throw new Error("A nuvem não retornou os registros. Tente novamente.");
    if (data.length === 0) return rows;
    const lastId = data[data.length - 1].id;
    if (typeof lastId !== "string" || (cursor !== null && lastId <= cursor)) {
      throw new Error("A paginação da nuvem não avançou. Tente novamente.");
    }
    rows.push(...data);
    cursor = lastId;
  }
}

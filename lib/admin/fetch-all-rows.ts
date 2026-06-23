// Supabase / PostgREST returns at most ~1000 rows per request. Admin CSV exports
// iterate over whole tables (model_services has thousands of rows), so an unbounded
// `.select()` silently truncates the template to the first 1000 rows. This helper
// pages through `.range()` until the table is exhausted.
//
// IMPORTANT: give the query a stable `.order(...)` (ideally on the primary key /
// a unique-ish column) so pages don't overlap or skip rows between requests.
export async function fetchAllRows<T = any>(
  makeQuery: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
  pageSize = 1000,
): Promise<T[]> {
  const all: T[] = []
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await makeQuery(from, from + pageSize - 1)
    if (error) throw error
    if (!data || data.length === 0) break
    all.push(...data)
    if (data.length < pageSize) break
  }
  return all
}

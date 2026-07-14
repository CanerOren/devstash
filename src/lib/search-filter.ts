// Custom filter for the command palette's cmdk <Command>.
//
// cmdk's default filter scores any *subsequence* match, so matching over an
// item's content preview makes short queries match almost everything: typing
// "test" surfaces every item whose body merely contains the letters t‑e‑s‑t in
// order (trivially common in code/text). To keep results tight, we apply fuzzy
// (subsequence) matching only to the short primary label (item title /
// collection name) and match the longer secondary text (tags + content preview)
// by literal substring only.

// Case-insensitive subsequence test: are all of `query`'s chars present in
// `text` in order (with gaps allowed)? Callers lower-case both first.
export function isSubsequence(query: string, text: string): boolean {
  let i = 0;
  for (let j = 0; j < text.length && i < query.length; j++) {
    if (text[j] === query[i]) i++;
  }
  return i === query.length;
}

// cmdk filter signature: (value, search, keywords) => score, where 0 hides the
// item. We ignore `value` (used only as the item's unique id) and rank by
// `keywords`: keywords[0] is the primary label; the rest are secondary text.
export function commandFilter(
  value: string,
  search: string,
  keywords?: string[],
): number {
  const q = search.trim().toLowerCase();
  if (!q) return 1; // empty query → show everything (browse mode)

  const label = (keywords?.[0] ?? "").toLowerCase();
  const extra = (keywords ?? []).slice(1).join(" ").toLowerCase();

  const idx = label.indexOf(q);
  if (idx === 0) return 1; // label starts with the query — strongest
  if (idx > 0) return 0.9; // label contains the query
  if (isSubsequence(q, label)) return 0.7; // fuzzy match on the short label
  if (extra.includes(q)) return 0.5; // literal match in tags / content preview
  return 0; // no match — hidden
}

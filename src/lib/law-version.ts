import { getProvider } from "./git-provider";

/**
 * Resolve @{date} to the nearest law tag ref.
 * Tags follow the format: law/{slug}/{YYYY-MM-DD}
 * Returns the tag name whose date is <= the requested date, or null.
 */
export async function resolveLawVersion(repoUrl: string, slug: string, date: string): Promise<string | null> {
  const { provider, repo } = getProvider(repoUrl);
  const prefix = `law/${slug}/`;
  const tags = await provider.listTags(repo, prefix);
  // Tags are sorted descending (newest first). Find first tag <= date.
  for (const tag of tags) {
    const tagDate = tag.slice(prefix.length);
    if (tagDate <= date) return tag;
  }
  return null;
}

import type { RawArticle } from '../types.js'

const TRACKED_REPOS = [
  'vercel/next.js',
  'microsoft/vscode',
  'ollama/ollama',
  'langchain-ai/langchain',
  'continuedev/continue',
  'astral-sh/uv',
  'ggerganov/llama.cpp',
  'open-webui/open-webui',
  'huggingface/transformers',
  'antirez/redis',
]

export async function fetchGithubReleases(): Promise<RawArticle[]> {
  const results: RawArticle[] = []
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
  }
  if (process.env.GITHUB_PAT) {
    headers.Authorization = `Bearer ${process.env.GITHUB_PAT}`
  }

  await Promise.allSettled(
    TRACKED_REPOS.map(async (repo) => {
      try {
        const res = await fetch(
          `https://api.github.com/repos/${repo}/releases?per_page=3`,
          { headers }
        )
        if (!res.ok) return
        const releases = await res.json()
        for (const release of releases) {
          if (!release.html_url || !release.name) continue
          results.push({
            url: release.html_url,
            title: `${repo.split('/')[1]} ${release.tag_name}: ${release.name}`,
            source: 'GitHub Releases',
            category: 'dev_tools',
            excerpt: release.body ? release.body.slice(0, 200).replace(/#+\s/g, '') : null,
            published_at: release.published_at ?? null,
          })
        }
      } catch (err) {
        console.warn(`GitHub fetch failed for ${repo}:`, (err as Error).message)
      }
    })
  )

  return results
}

export type Category = 'ai_llm' | 'dev_tools' | 'india_business' | 'global_macro' | 'others'

export interface RawArticle {
  url: string
  title: string
  source: string
  category: Category
  excerpt: string | null
  published_at: string | null
}

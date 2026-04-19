export type Category = 'ai_llm' | 'dev_tools' | 'india_business' | 'global_macro' | 'others'

export type Signal = 'up' | 'down'

export interface Article {
  id: string
  url: string
  title: string
  source: string
  category: Category
  excerpt: string | null
  ai_insight: string | null
  published_at: string | null
  ingested_at: string
  preference_score: number
}

export interface UserSignal {
  id: string
  user_id: string
  article_id: string
  signal: Signal
  created_at: string
}

export interface UserProfile {
  id: string
  user_interest_vector: Record<string, number>
  signal_count: number
  created_at: string
  updated_at: string
}

export interface SavedArticle {
  article_id: string
  title: string
  url: string
  source: string
  category: Category
  excerpt: string | null
  ai_insight: string | null
  savedAt: string
}

export interface CustomFeed {
  id: string
  name: string
  rss_url: string
  addedAt: string
}

// Supabase database type map
export interface Database {
  public: {
    Tables: {
      articles: {
        Row: Article
        Insert: Omit<Article, 'id' | 'ingested_at' | 'preference_score'>
        Update: Partial<Omit<Article, 'id'>>
      }
      user_signals: {
        Row: UserSignal
        Insert: Omit<UserSignal, 'id' | 'created_at'>
        Update: Partial<Omit<UserSignal, 'id'>>
      }
      user_profiles: {
        Row: UserProfile
        Insert: Omit<UserProfile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserProfile, 'id' | 'created_at'>>
      }
    }
  }
}

export const CATEGORY_LABELS: Record<Category, string> = {
  ai_llm: 'AI & LLMs',
  dev_tools: 'Dev Tools & OSS',
  india_business: 'India Business',
  global_macro: 'Global Macro',
  others: 'Others',
}

export const CATEGORY_ORDER: Category[] = [
  'ai_llm',
  'dev_tools',
  'india_business',
  'global_macro',
  'others',
]

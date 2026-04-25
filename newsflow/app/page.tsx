import { createClient } from '@/lib/supabase/server'
import FeedView from '@/components/feed/FeedView'
import LandingPage from '@/components/marketing/LandingPage'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <LandingPage />
  return <FeedView />
}

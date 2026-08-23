import { ProductsWorkspace } from '@/components/shared/ProductsWorkspace'

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view = 'current' } = await searchParams
  return <ProductsWorkspace view={view} basePath="/partner/products" />
}

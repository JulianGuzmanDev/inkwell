export default async function Home() {
  const { default: PublicHome } = await import('./(public)/page')
  return <PublicHome />
}

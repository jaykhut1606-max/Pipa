// Public, indexed routes. SEO metadata is owned by the root layout
// plus per-page exports. No auth gate here.
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

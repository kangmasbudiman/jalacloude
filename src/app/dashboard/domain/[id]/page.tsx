import DomainDetailClient from "./client";

/** Halaman tergantung data klien (localStorage/Supabase) — render blocking saja */
export const instant = false;

export default async function DomainDetailPage({
  params,
}: PageProps<"/dashboard/domain/[id]">) {
  const { id } = await params;
  return <DomainDetailClient id={id} />;
}

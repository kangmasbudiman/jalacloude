import VpsDetailClient from "./client";

/** Halaman tergantung data klien (localStorage/Supabase) — render blocking saja */
export const instant = false;

export default async function VpsDetailPage({
  params,
}: PageProps<"/dashboard/vps/[id]">) {
  const { id } = await params;
  return <VpsDetailClient id={id} />;
}

import InvoiceClient from "./client";

/** Data diambil sisi klien (sesi Supabase) — hindari render blocking */
export const instant = false;

export default async function InvoicePage({ params }: PageProps<"/invoice/[id]">) {
  const { id } = await params;
  return <InvoiceClient id={id} />;
}

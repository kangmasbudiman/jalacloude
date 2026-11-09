import Link from "next/link";
import { notFound } from "next/navigation";
import { HardDriveUpload, ArrowLeft } from "lucide-react";
import { MENU_ITEMS, findMenu } from "@/lib/menu";

/** Halaman placeholder untuk menu yang belum dibangun (Segera Hadir) */
export function generateStaticParams() {
  return MENU_ITEMS.filter((item) => item.slug).map((item) => ({
    slug: item.slug,
  }));
}

export default async function MenuPlaceholderPage({
  params,
}: PageProps<"/dashboard/[slug]">) {
  const { slug } = await params;
  const menu = findMenu(slug);

  if (!menu || menu.slug === "") notFound();

  return (
    <div className="mx-auto grid max-w-6xl place-items-center px-6 py-24 text-center">
      <div className="grid size-14 place-items-center rounded-2xl bg-brand-pale text-brand">
        <HardDriveUpload className="size-6" />
      </div>
      <h1 className="mt-5 text-2xl font-medium text-ink">{menu.label}</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-copy">
        {menu.description || "Modul ini sedang dalam pengembangan."}
      </p>
      <span className="mt-4 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-600">
        Segera Hadir
      </span>
      <Link
        href="/dashboard"
        className="mt-6 inline-flex h-10 items-center gap-2 rounded-full border border-line bg-white px-4 text-sm font-medium text-ink hover:bg-surface"
      >
        <ArrowLeft className="size-4" /> Kembali ke Ringkasan
      </Link>
    </div>
  );
}

import {
  LayoutDashboard,
  Server,
  Network,
  Container,
  Rocket,
  Database,
  HardDrive,
  Globe,
  Mail,
  Sparkles,
  Wallet,
  Users,
  GraduationCap,
  LifeBuoy,
  Settings,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export type MenuItem = {
  slug: string;
  label: string;
  icon: LucideIcon;
  /** deskripsi singkat untuk halaman "Segera Hadir" */
  description: string;
  /** hanya tampil untuk role admin */
  adminOnly?: boolean;
};

/** Menu sidebar — daftar layanan dashboard */
export const MENU_ITEMS: MenuItem[] = [
  { slug: "", label: "Ringkasan", icon: LayoutDashboard, description: "" },
  { slug: "vps", label: "VPS", icon: Server, description: "" },
  {
    slug: "vps-nat",
    label: "VPS NAT",
    icon: Network,
    description: "VPS hemat dengan IP bersama + port forwarding.",
  },
  {
    slug: "pods",
    label: "Pods",
    icon: Container,
    description: "Kontainer aplikasi siap pakai dalam hitungan detik.",
  },
  {
    slug: "services",
    label: "Layanan App",
    icon: Rocket,
    description: "Deploy aplikasi & Docker image dengan mudah.",
  },
  {
    slug: "database",
    label: "Database",
    icon: Database,
    description: "Database MySQL & PostgreSQL terkelola.",
  },
  {
    slug: "storage",
    label: "Storage",
    icon: HardDrive,
    description: "Object storage S3-kompatibel untuk file & aset.",
  },
  {
    slug: "domain",
    label: "Domain",
    icon: Globe,
    description: "Registrasi, transfer, dan pengelolaan domain.",
  },
  {
    slug: "email",
    label: "Email",
    icon: Mail,
    description: "Email bisnis dengan domain sendiri.",
  },
  {
    slug: "ai",
    label: "AI",
    icon: Sparkles,
    description: "Akses berbagai model AI lewat satu API key.",
  },
  {
    slug: "billing",
    label: "Dompet & Tagihan",
    icon: Wallet,
    description: "Saldo, top-up, dan riwayat pembayaran.",
  },
  {
    slug: "admin",
    label: "Admin Panel",
    icon: ShieldCheck,
    description: "Kelola client & kirim invoice.",
    adminOnly: true,
  },
  {
    slug: "affiliate",
    label: "Affiliate",
    icon: Users,
    description: "Ajak teman, dapatkan komisi referral.",
  },
  {
    slug: "learn",
    label: "Belajar",
    icon: GraduationCap,
    description: "Kursus, webinar, dan tutorial video.",
  },
  {
    slug: "support",
    label: "Dukungan",
    icon: LifeBuoy,
    description: "Tiket bantuan dan pusat solusi.",
  },
  { slug: "settings", label: "Pengaturan", icon: Settings, description: "" },
];

export function findMenu(slug: string): MenuItem | undefined {
  return MENU_ITEMS.find((item) => item.slug === slug);
}

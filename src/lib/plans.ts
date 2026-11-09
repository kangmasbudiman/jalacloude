/** Konfigurasi paket & pilihan VPS — dipakai halaman daftar dan detail */

export type VpsPlan = {
  name: string;
  cpu: string;
  ram: string;
  disk: string;
  price: number;
  popular?: boolean;
};

export const VPS_PLANS: VpsPlan[] = [
  { name: "Jala Mini", cpu: "1 vCPU", ram: "1 GB", disk: "20 GB NVMe", price: 350000 },
  { name: "Jala Pro", cpu: "2 vCPU", ram: "4 GB", disk: "60 GB NVMe", price: 550000, popular: true },
  { name: "Jala Max", cpu: "4 vCPU", ram: "8 GB", disk: "120 GB NVMe", price: 645000 },
];

export const REGIONS = ["Jakarta", "Surabaya", "Singapura"];

export const OS_OPTIONS = ["Ubuntu 24.04", "Debian 12", "AlmaLinux 9"];

export function findPlan(name: string): VpsPlan {
  return VPS_PLANS.find((p) => p.name === name) ?? VPS_PLANS[0];
}

/** Nilai CPU/RAM dalam angka untuk tampilan meter */
export function planMetrics(plan: VpsPlan): { cpuCount: number; ramGb: number; diskGb: number } {
  return {
    cpuCount: Number(plan.cpu.replace(" vCPU", "")) || 1,
    ramGb: Number(plan.ram.replace(" GB", "")) || 1,
    diskGb: Number(plan.disk.replace(" GB NVMe", "").replace(" GB", "")) || 20,
  };
}

// Registry ikon (lucide-react v1).
//
// Data file menyimpan NAMA ikon sebagai string supaya tetap serializable
// (meniru bentuk respons API), lalu di-resolve jadi komponen di sini. Karena
// `IconName` diturunkan dari objek `icons` di bawah, nama yang salah ketik jadi
// error TypeScript saat build — bukan ikon kosong yang baru ketahuan di runtime.
//
// Catatan versi: lucide v1 mengganti sebagian nama dari v0 (`ParkingCircle` →
// `CircleParking`, `Waves` → `WavesHorizontal`/`WavesLadder`) dan menghapus
// ikon brand seperti Instagram/Facebook. Jangan menebak nama — cek dulu di
// node_modules/lucide-react/dist/lucide-react.d.ts.
import {
  ChefHat,
  Clock,
  Coffee,
  Flame,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Mountain,
  CircleParking,
  Phone,
  ShowerHead,
  Snowflake,
  Sofa,
  Tent,
  Thermometer,
  Ticket,
  Users,
  UtensilsCrossed,
  WavesLadder,
  Wifi,
  X,
  type LucideIcon,
} from 'lucide-react';

export const icons = {
  ChefHat,
  CircleParking,
  Clock,
  Coffee,
  Flame,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Mountain,
  Phone,
  ShowerHead,
  Snowflake,
  Sofa,
  Tent,
  Thermometer,
  Ticket,
  Users,
  UtensilsCrossed,
  WavesLadder,
  Wifi,
  X,
} as const satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof icons;

/** Ambil komponen ikon dari namanya. */
export function getIcon(name: IconName): LucideIcon {
  return icons[name];
}

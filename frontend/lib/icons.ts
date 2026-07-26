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
  Armchair,
  Baby,
  Bath,
  BedDouble,
  BellRing,
  Camera,
  ChefHat,
  Clock,
  Coffee,
  ConciergeBell,
  CookingPot,
  Cross,
  Droplets,
  Flame,
  Footprints,
  Gamepad2,
  Info,
  Landmark,
  Mail,
  MapPin,
  Martini,
  Menu,
  MessageCircle,
  Moon,
  Mountain,
  CircleParking,
  Phone,
  Plug,
  Refrigerator,
  ShieldCheck,
  ShowerHead,
  Snowflake,
  Sofa,
  Tent,
  Thermometer,
  Ticket,
  Toilet,
  Trees,
  Tv,
  UserPlus,
  Users,
  UtensilsCrossed,
  WavesLadder,
  Wifi,
  Wind,
  X,
  type LucideIcon,
} from 'lucide-react';

export const icons = {
  Armchair,
  Baby,
  Bath,
  BedDouble,
  BellRing,
  Camera,
  ChefHat,
  CircleParking,
  Clock,
  Coffee,
  ConciergeBell,
  CookingPot,
  Cross,
  Droplets,
  Flame,
  Footprints,
  Gamepad2,
  Info,
  Landmark,
  Mail,
  MapPin,
  Martini,
  Menu,
  MessageCircle,
  Moon,
  Mountain,
  Phone,
  Plug,
  Refrigerator,
  ShieldCheck,
  ShowerHead,
  Snowflake,
  Sofa,
  Tent,
  Thermometer,
  Ticket,
  Toilet,
  Trees,
  Tv,
  UserPlus,
  Users,
  UtensilsCrossed,
  WavesLadder,
  Wifi,
  Wind,
  X,
} as const satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof icons;

/** Ambil komponen ikon dari namanya. */
export function getIcon(name: IconName): LucideIcon {
  return icons[name];
}

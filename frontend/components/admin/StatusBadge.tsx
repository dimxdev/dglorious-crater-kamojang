import { Badge } from '@/components/ui';
import { statusLabelId, type BookingChannel, type BookingStatus } from '@/lib/data/admin';

// Tone status booking Fase 1: DP kuning, Lunas biru, Check-in hijau, dst.
const adminTone: Record<BookingStatus, React.ComponentProps<typeof Badge>['tone']> = {
  DP: 'warning',
  LUNAS: 'info',
  CHECKED_IN: 'success',
  COMPLETED: 'forest',
  HANGUS: 'danger',
  NO_SHOW: 'terracotta',
};

// Lebar tetap supaya kolom status rapi & sejajar, apapun panjang labelnya.
export function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <Badge tone={adminTone[status]} className="w-21 justify-center">
      {statusLabelId[status]}
    </Badge>
  );
}

export function SourceBadge({ source }: { source: BookingChannel }) {
  return (
    <Badge
      tone={source === 'WHATSAPP' ? 'info' : 'terracotta'}
      className="w-21 justify-center"
    >
      {source === 'WHATSAPP' ? 'WhatsApp' : 'Walk-in'}
    </Badge>
  );
}

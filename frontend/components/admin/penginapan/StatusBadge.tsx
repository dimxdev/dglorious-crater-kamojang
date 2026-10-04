import { Badge } from '@/components/ui';
import { statusLabelId, type BookingChannel, type BookingStatus } from '@/lib/data/admin';

// Tone status booking: DP kuning, Lunas biru, Check-in hijau, dst.
const adminTone: Record<BookingStatus, React.ComponentProps<typeof Badge>['tone']> = {
  DP: 'warning',
  LUNAS: 'info',
  CHECKED_IN: 'success',
  COMPLETED: 'forest',
  HANGUS: 'danger',
  NO_SHOW: 'terracotta',
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  return <Badge tone={adminTone[status]}>{statusLabelId[status]}</Badge>;
}

export function SourceBadge({ source }: { source: BookingChannel }) {
  return (
    <Badge tone={source === 'WHATSAPP' ? 'info' : 'terracotta'}>
      {source === 'WHATSAPP' ? 'WhatsApp' : 'Walk-in'}
    </Badge>
  );
}

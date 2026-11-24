import { Badge } from '@/components/ui';
import { statusLabelId, type ReservationChannel, type ReservationStatus } from '@/lib/data/admin';

// Tone status reservasi: DP kuning, Lunas biru, Check-in hijau, dst.
const adminTone: Record<ReservationStatus, React.ComponentProps<typeof Badge>['tone']> = {
  DP: 'warning',
  LUNAS: 'info',
  CHECKED_IN: 'success',
  COMPLETED: 'forest',
  HANGUS: 'danger',
  NO_SHOW: 'terracotta',
};

export function StatusBadge({ status }: { status: ReservationStatus }) {
  return <Badge tone={adminTone[status]}>{statusLabelId[status]}</Badge>;
}

export function SourceBadge({ source }: { source: ReservationChannel }) {
  return (
    <Badge tone={source === 'RESERVASI' ? 'info' : 'terracotta'}>
      {source === 'RESERVASI' ? 'Reservasi' : 'Langsung'}
    </Badge>
  );
}

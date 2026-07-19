import { Badge } from '@/components/ui';
import { statusLabelId } from '@/lib/data/admin';

// Tone status booking untuk dashboard (Confirmed biru, Check-in hijau, dst).
const adminTone: Record<string, React.ComponentProps<typeof Badge>['tone']> = {
  PENDING: 'neutral',
  WAITING_PAYMENT: 'warning',
  PAID: 'info',
  CONFIRMED: 'info',
  CHECKED_IN: 'success',
  COMPLETED: 'forest',
  EXPIRED: 'danger',
  CANCELLED: 'danger',
  REJECTED: 'danger',
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={adminTone[status] ?? 'neutral'}>{statusLabelId[status] ?? status}</Badge>;
}

export function SourceBadge({ source }: { source: 'ONLINE' | 'WALK_IN' }) {
  return (
    <Badge tone={source === 'ONLINE' ? 'info' : 'terracotta'}>
      {source === 'ONLINE' ? 'Online' : 'Walk-in'}
    </Badge>
  );
}

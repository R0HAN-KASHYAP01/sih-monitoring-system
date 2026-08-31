const STATUS_STYLES = {
  approved: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  pending: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
  rejected: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200',
  normal: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  flagged: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200',
  online: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  offline: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200',
  review: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
  unknown: 'bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200',
};

function formatLabel(status) {
  if (!status) return 'Unknown';
  if (status === 'flagged') return 'Flagged';
  if (status === 'review') return 'Needs Review';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function StatusBadge({ status, compact = false }) {
  const key = status || 'unknown';
  const styles = STATUS_STYLES[key] || STATUS_STYLES.unknown;
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${styles} ${
        compact ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
      }`}
    >
      {formatLabel(status)}
    </span>
  );
}
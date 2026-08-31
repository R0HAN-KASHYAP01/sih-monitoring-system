const STATUS_CONFIG = {
  online: { ring: 'ring-emerald-200', dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  offline: { ring: 'ring-red-200', dot: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50' },
  unknown: { ring: 'ring-gray-200', dot: 'bg-gray-400', text: 'text-gray-600', bg: 'bg-gray-50' },
};

export default function CameraCard({ label, status, checkedAt }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.unknown;
  const statusLabel = status === 'online' ? 'Online' : status === 'offline' ? 'Offline' : 'Unknown';

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className={`flex h-28 items-center justify-center border-b border-gray-100 ${config.bg}`}>
        <svg className="h-9 w-9 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 10l4.55-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.45.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      </div>
      <div className="p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium text-gray-900">{label || 'Unnamed camera'}</p>
          <span
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${config.bg} ${config.text} ${config.ring}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
            {statusLabel}
          </span>
        </div>
        <p className="text-xs text-gray-500">
          {checkedAt ? `Last checked ${new Date(checkedAt).toLocaleString()}` : 'No status data yet'}
        </p>
        <p className="mt-2 text-[11px] text-gray-400">Live feed integration pending</p>
      </div>
    </div>
  );
}
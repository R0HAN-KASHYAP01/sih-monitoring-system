// FILE: apps/web/components/dashboard/dashboard/RiskBadge.jsx

const BAND_STYLES = {
  LOW: 'bg-green-50 text-green-700 border border-green-200',
  MEDIUM: 'bg-amber-50 text-amber-700 border border-amber-200',
  HIGH: 'bg-orange-50 text-orange-700 border border-orange-200',
  CRITICAL: 'bg-red-50 text-red-700 border border-red-200',
};

export default function RiskBadge({ score, band }) {
  if (band == null || score == null) {
    return <span className="text-xs text-gray-400">Not yet scored</span>;
  }

  const style = BAND_STYLES[band] || 'bg-gray-100 text-gray-600 border border-gray-200';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${style}`}>
      {score} · {band}
    </span>
  );
}
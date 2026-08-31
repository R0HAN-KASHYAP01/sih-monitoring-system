export default function StatCard({ label, value, tone = 'default', hint }) {
  const accentStyles = {
    default: 'bg-blue-500',
    approved: 'bg-emerald-500',
    pending: 'bg-amber-500',
    rejected: 'bg-red-500',
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <span className={`absolute inset-y-0 left-0 w-1 ${accentStyles[tone] || accentStyles.default}`} />
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}
export default function AttendanceTrendChart({ records }) {
  if (!records || records.length === 0) return null;

  const width = 600;
  const height = 220;
  const paddingX = 40;
  const paddingY = 24;
  const innerWidth = width - paddingX * 2;
  const innerHeight = height - paddingY * 2;

  const values = records
    .flatMap((r) => [r.reported_count, r.historical_average])
    .filter((v) => typeof v === 'number');
  const maxValue = values.length ? Math.max(...values) : 1;

  const xStep = records.length > 1 ? innerWidth / (records.length - 1) : 0;

  const scaleY = (value) => {
    if (typeof value !== 'number' || maxValue === 0) return height - paddingY;
    const ratio = value / maxValue;
    return height - paddingY - ratio * innerHeight;
  };

  const buildPoints = (key) =>
    records
      .map((r, i) => (typeof r[key] === 'number' ? `${paddingX + i * xStep},${scaleY(r[key])}` : null))
      .filter(Boolean)
      .join(' ');

  const reportedPoints = buildPoints('reported_count');
  const historicalPoints = buildPoints('historical_average');

  const firstDate = records[0]?.date;
  const lastDate = records[records.length - 1]?.date;

  return (
    <div>
      <div className="mb-3 flex items-center gap-4 text-xs text-gray-600">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
          Reported
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full border border-gray-400 bg-white" />
          Historical Average
        </span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label="Reported attendance versus historical average"
      >
        <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="#e5e7eb" strokeWidth="1" />
        <line x1={paddingX} y1={paddingY} x2={paddingX} y2={height - paddingY} stroke="#e5e7eb" strokeWidth="1" />
        {historicalPoints && (
          <polyline points={historicalPoints} fill="none" stroke="#9ca3af" strokeWidth="2" strokeDasharray="4 3" />
        )}
        {reportedPoints && <polyline points={reportedPoints} fill="none" stroke="#3b82f6" strokeWidth="2.5" />}
        {records.map((r, i) =>
          typeof r.reported_count === 'number' ? (
            <circle key={`pt-${i}`} cx={paddingX + i * xStep} cy={scaleY(r.reported_count)} r="3" fill="#3b82f6" />
          ) : null
        )}
      </svg>
      <div className="mt-1 flex justify-between text-[11px] text-gray-400">
        <span>{firstDate ? new Date(firstDate).toLocaleDateString() : ''}</span>
        <span>{lastDate ? new Date(lastDate).toLocaleDateString() : ''}</span>
      </div>
    </div>
  );
}
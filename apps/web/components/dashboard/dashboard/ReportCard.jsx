'use client';

import { useState } from 'react';

function truncate(text, length = 220) {
  if (!text) return '';
  if (text.length <= length) return text;
  return `${text.slice(0, length).trimEnd()}…`;
}

export default function ReportCard({ content, createdAt, similarityScore }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = (content || '').length > 220;

  let attention = null;
  if (typeof similarityScore === 'number') {
    attention =
      similarityScore < 0.5
        ? { label: 'Needs review', bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200' }
        : { label: 'Consistent', bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200' };
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium text-gray-500">
          {createdAt ? new Date(createdAt).toLocaleString() : 'Unknown date'}
        </p>
        <div className="flex items-center gap-2">
          {typeof similarityScore === 'number' && (
            <span className="text-xs text-gray-400">Similarity: {(similarityScore * 100).toFixed(0)}%</span>
          )}
          {attention && (
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${attention.bg} ${attention.text} ring-1 ring-inset ${attention.ring}`}
            >
              {attention.label}
            </span>
          )}
        </div>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
        {expanded ? content : truncate(content)}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-xs font-medium text-blue-600 transition-colors hover:text-blue-800"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
}
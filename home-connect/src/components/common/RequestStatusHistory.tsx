import React from 'react';
import { ProductRequest } from '../../types/index.ts';

interface RequestStatusHistoryProps {
  history?: ProductRequest['statusHistory'];
}

export const RequestStatusHistory: React.FC<RequestStatusHistoryProps> = ({ history }) => {
  if (!history?.length) return null;

  return (
    <details className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2">
      <summary className="cursor-pointer text-xs font-semibold text-stone-700">Request history ({history.length})</summary>
      <ol className="mt-2 space-y-2 border-l border-stone-200 pl-3">
        {history.map((entry, index) => (
          <li key={`${entry.timestamp}-${index}`} className="text-xs text-stone-600">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="font-semibold capitalize text-stone-800">{entry.status.replace('_', ' ')}</span>
              <time dateTime={entry.timestamp} className="text-[11px] text-stone-400">
                {new Date(entry.timestamp).toLocaleString()}
              </time>
            </div>
            {entry.note && <p className="mt-0.5">{entry.note}</p>}
          </li>
        ))}
      </ol>
    </details>
  );
};
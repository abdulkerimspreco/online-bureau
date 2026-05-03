import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

interface LegalPageLayoutProps {
  title: string;
  updatedOn: string;
  children: ReactNode;
}

export default function LegalPageLayout({
  title,
  updatedOn,
  children,
}: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/login"
          className="text-sm font-medium text-slate-600 underline underline-offset-4"
        >
          Back to account access
        </Link>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Online Bureau
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950">
            {title}
          </h1>
          <p className="mt-2 text-sm text-slate-500">Last updated: {updatedOn}</p>

          <div className="mt-8 space-y-8 text-sm leading-7 text-slate-700">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

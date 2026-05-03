import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export default function AuthLayout({
  title,
  subtitle,
  children,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-2">
        <div className="hidden lg:flex flex-col justify-between bg-slate-900 p-10 text-white">
          <div>
            <div className="inline-flex items-center rounded-full border border-white/20 px-3 py-1 text-sm text-slate-200">
              Online Bureau
            </div>
          </div>

          <div className="max-w-lg">
            <h1 className="text-4xl font-semibold leading-tight">
              Find the right people. Protect candidate privacy.
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-300">
              A modern hiring platform where job seekers manage their CVs and
              employers discover talent through structured search and tagging.
            </p>
          </div>

          <div className="text-sm text-slate-400">
            Milestone 2 · React + NestJS + Prisma
          </div>
        </div>

        <div className="flex items-center justify-center px-6 py-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-8">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
                {title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {subtitle}
              </p>
            </div>

            {children}

            <div className="mt-8 border-t border-slate-100 pt-5 text-sm text-slate-500">
              <p>
                By using Online Bureau, you can review our{' '}
                <Link
                  to="/terms"
                  className="font-medium text-slate-900 underline underline-offset-4"
                >
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link
                  to="/privacy"
                  className="font-medium text-slate-900 underline underline-offset-4"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

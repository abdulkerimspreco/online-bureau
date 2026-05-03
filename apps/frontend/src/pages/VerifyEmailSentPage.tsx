import { Link, useLocation } from 'react-router-dom';
import AuthLayout from '../components/layout/AuthLayout';

interface VerifyEmailSentState {
  email?: string;
  verificationPreviewUrl?: string;
  role?: 'JOB_SEEKER' | 'EMPLOYER';
}

export default function VerifyEmailSentPage() {
  const location = useLocation();
  const state = (location.state as VerifyEmailSentState | null) ?? null;
  const isEmployer = state?.role === 'EMPLOYER';

  return (
    <AuthLayout
      title="Verify your email"
      subtitle={
        isEmployer
          ? 'Confirm your company email to unlock employer features.'
          : 'Your account stays inactive until your email address is confirmed.'
      }
    >
      <div className="space-y-5 text-sm leading-6 text-slate-600">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
          <p className="font-medium text-slate-900">Verification pending</p>
          <p className="mt-2">
            We generated a verification link for{' '}
            <span className="font-medium text-slate-900">
              {state?.email ?? 'your new account'}
            </span>
            .{' '}
            {isEmployer
              ? 'You can still log in now, but search and contact features should stay limited until verification is complete.'
              : 'Once you verify, you can log in normally.'}
          </p>
        </div>

        {state?.verificationPreviewUrl ? (
          <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4">
            <p className="font-medium text-sky-900">Development preview link</p>
            <p className="mt-2 text-sky-800">
              This milestone build exposes the verification link directly instead
              of sending a real email.
            </p>
            <a
              href={state.verificationPreviewUrl}
              className="mt-3 inline-flex text-sm font-medium text-slate-900 underline underline-offset-4"
            >
              Open verification link
            </a>
          </div>
        ) : (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-amber-900">
            The verification preview link is only shown immediately after
            registration in this milestone build.
          </div>
        )}

        <p>
          Already verified?{' '}
          <Link
            to="/login"
            className="font-medium text-slate-900 underline underline-offset-4"
          >
            Go to login
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

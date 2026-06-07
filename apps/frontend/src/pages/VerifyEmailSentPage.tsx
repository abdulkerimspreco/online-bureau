import { Link, useLocation } from 'react-router-dom';
import AuthLayout from '../components/layout/AuthLayout';
import type { DeliveryMethod } from '../api/auth/auth.types';

interface VerifyEmailSentState {
  email?: string;
  deliveryMethod?: DeliveryMethod;
  verificationPreviewUrl?: string;
  role?: 'JOB_SEEKER' | 'EMPLOYER';
}

export default function VerifyEmailSentPage() {
  const location = useLocation();
  const state = (location.state as VerifyEmailSentState | null) ?? null;
  const isEmployer = state?.role === 'EMPLOYER';
  const usingPreviewLink = state?.deliveryMethod === 'PREVIEW' && Boolean(state?.verificationPreviewUrl);

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
            {usingPreviewLink ? 'We prepared a verification link for ' : 'We sent a verification email to '}
            <span className="font-medium text-slate-900">
              {state?.email ?? 'your new account'}
            </span>
            .{' '}
            {isEmployer
              ? 'You can still log in now, but search and contact features should stay limited until verification is complete.'
              : 'Once you verify, you can log in normally.'}
          </p>
        </div>

        {usingPreviewLink ? (
          <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4">
            <p className="font-medium text-sky-900">Verification preview link</p>
            <p className="mt-2 text-sky-800">
              Email delivery is not configured in this environment, so the
              verification link is shown directly for testing.
            </p>
            <a
              href={state?.verificationPreviewUrl}
              className="mt-3 inline-flex text-sm font-medium text-slate-900 underline underline-offset-4"
            >
              Open verification link
            </a>
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-emerald-900">
            Check your inbox and spam folder for the verification email. Once
            you confirm your address, you can continue with the normal login
            flow.
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

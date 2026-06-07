import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthLayout from '../components/layout/AuthLayout';
import { verifyEmail } from '../api/auth/auth.api';

const verificationRequests = new Map<string, Promise<string>>();
const verificationResults = new Map<string, string>();

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading',
  );
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Missing verification token.');
      return;
    }

    const verificationToken = token;

    async function runVerification() {
      const cachedSuccessMessage = verificationResults.get(verificationToken);

      if (cachedSuccessMessage) {
        setStatus('success');
        setMessage(cachedSuccessMessage);
        return;
      }

      try {
        let request = verificationRequests.get(verificationToken);

        if (!request) {
          request = verifyEmail({ token: verificationToken }).then(
            (response) => response.message,
          );
          verificationRequests.set(verificationToken, request);
        }

        const successMessage = await request;
        verificationResults.set(verificationToken, successMessage);
        setStatus('success');
        setMessage(successMessage);
      } catch (err: any) {
        verificationRequests.delete(verificationToken);
        setStatus('error');
        setMessage(
          err?.response?.data?.message || 'Failed to verify your email.',
        );
      } finally {
        verificationRequests.delete(verificationToken);
      }
    }

    runVerification();
  }, [searchParams]);

  return (
    <AuthLayout
      title="Email verification"
      subtitle="We’re confirming your account before full access is unlocked."
    >
      <div className="space-y-5">
        <div
          className={`rounded-2xl border px-4 py-4 text-sm leading-6 ${
            status === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : status === 'error'
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-slate-200 bg-slate-50 text-slate-700'
          }`}
        >
          {message}
        </div>

        <p className="text-sm text-slate-600">
          <Link
            to="/login"
            className="font-medium text-slate-900 underline underline-offset-4"
          >
            Continue to login
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

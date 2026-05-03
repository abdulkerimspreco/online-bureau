import { useState } from 'react';
import { requestVerificationLink } from '../../api/auth/auth.api';
import { useAuth } from '../../context/auth/AuthContext';

export default function EmployerVerificationNotice() {
  const { refreshMe } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  async function handleVerifyNow() {
    setError('');
    setIsGenerating(true);

    try {
      const response = await requestVerificationLink();
      window.location.href = response.verificationPreviewUrl;
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Unable to generate a verification link.';
      setError(message);

      if (message === 'Email already verified') {
        await refreshMe();
      }
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-amber-900">
            Employer account not verified
          </p>
          <p className="mt-1 text-sm leading-6 text-amber-800">
            Your company account is currently marked as unverified. Keep your
            company profile complete so the verification flow can be added cleanly
            in the next release.
          </p>

          {error ? (
            <p className="mt-2 text-sm text-red-700">{error}</p>
          ) : null}
        </div>

        <div className="flex flex-col items-start gap-3 sm:items-end">
          <span className="inline-flex w-fit rounded-full bg-amber-200 px-3 py-1 text-xs font-semibold text-amber-900">
            Unverified
          </span>
          <button
            type="button"
            onClick={handleVerifyNow}
            disabled={isGenerating}
            className="inline-flex rounded-xl bg-amber-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGenerating ? 'Verifying...' : 'Verify now'}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import TextInput from '../components/ui/TextInput';
import VerificationBadge from '../components/ui/VerificationBadge';
import EmployerVerificationNotice from '../components/ui/EmployerVerificationNotice';
import {
  getMyEmployerProfile,
  updateMyEmployerProfile,
} from '../api/profile/profile.api';
import type { EmployerProfile } from '../api/profile/profile.types';
import { formatDate } from '../utils/functionUtils';

type ProfileForm = {
  companyName: string;
  description: string;
  website: string;
  industry: string;
  companySize: string;
};

const emptyForm: ProfileForm = {
  companyName: '',
  description: '',
  website: '',
  industry: '',
  companySize: '',
};

export default function EmployerProfilePage() {
  const [profile, setProfile] = useState<EmployerProfile | null>(null);
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadProfile() {
    setError('');

    try {
      const data = await getMyEmployerProfile();
      setProfile(data);
      setForm({
        companyName: data.companyName ?? '',
        description: data.description ?? '',
        website: data.website ?? '',
        industry: data.industry ?? '',
        companySize: data.companySize ?? '',
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      const payload = {
        companyName: form.companyName.trim(),
        description: form.description.trim() || undefined,
        website: form.website.trim() || undefined,
        industry: form.industry.trim(),
        companySize: form.companySize.trim() || undefined,
      };

      const updatedProfile = await updateMyEmployerProfile(payload);
      setProfile(updatedProfile);
      setForm({
        companyName: updatedProfile.companyName ?? '',
        description: updatedProfile.description ?? '',
        website: updatedProfile.website ?? '',
        industry: updatedProfile.industry ?? '',
        companySize: updatedProfile.companySize ?? '',
      });
      setSuccess('Company profile updated successfully.');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <DashboardLayout
      title="Company Profile"
      subtitle="Present the basics employers and candidates need before the contact workflow is fully built."
    >
      <div className="space-y-6">
        {!profile?.user.isVerified && !isLoading ? (
          <EmployerVerificationNotice />
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <p className="text-sm font-medium text-slate-500">Company details</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            Employer profile
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Keep your public-facing company information current and credible.
          </p>

          {error ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          ) : null}

          {isLoading ? (
            <p className="mt-6 text-sm text-slate-500">Loading company profile...</p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <TextInput
                label="Company name"
                value={form.companyName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, companyName: e.target.value }))
                }
                placeholder="Online Bureau Ltd"
              />

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Description
                </span>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="We hire fullstack engineers and product-minded developers."
                  rows={5}
                  className="w-full resize-y rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200"
                />
              </label>

              <TextInput
                label="Website"
                value={form.website}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, website: e.target.value }))
                }
                placeholder="https://example.com"
              />

              <TextInput
                label="Industry"
                value={form.industry}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, industry: e.target.value }))
                }
                placeholder="Software"
              />

              <TextInput
                label="Company size"
                value={form.companySize}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, companySize: e.target.value }))
                }
                placeholder="11-50"
              />

              <Button type="submit" disabled={isSaving} fullWidth={false}>
                {isSaving ? 'Saving...' : 'Save company profile'}
              </Button>
            </form>
          )}
        </Card>

        <Card>
          <p className="text-sm font-medium text-slate-500">Account summary</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            Employer account
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            This is the account employers use to authenticate and manage hiring activity.
          </p>

          {isLoading ? (
            <p className="mt-6 text-sm text-slate-500">Loading account data...</p>
          ) : profile ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoItem label="Business email" value={profile.user.email} />
                <VerificationInfoItem isVerified={profile.user.isVerified} />
                <InfoItem label="Created" value={formatDate(profile.createdAt)} />
                <InfoItem
                  label="Last updated"
                  value={formatDate(profile.updatedAt)}
                />
              </div>
            </div>
          ) : null}
        </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

function VerificationInfoItem({ isVerified }: { isVerified: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        Verification
      </p>
      <div className="mt-1">
        <VerificationBadge isVerified={isVerified} />
      </div>
    </div>
  );
}

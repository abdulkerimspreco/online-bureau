import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import TextInput from "../components/ui/TextInput";
import ChipInput from "../components/ui/ChipInput";
import {
  getMyJobSeekerProfile,
  updateMyJobSeekerProfile,
} from "../api/profile/profile.api";
import type { JobSeekerProfile } from "../api/profile/profile.types";
import { formatDate } from "../utils/functionUtils";
import EmployerVerificationNotice from "../components/ui/EmployerVerificationNotice";
import VerificationBadge from "../components/ui/VerificationBadge";
import { deleteAccount } from "../api/auth/auth.api";
import { useAuth } from "../context/auth/AuthContext";

type ProfileForm = {
  displayName: string;
  location: string;
  preferredJobCategories: string[];
};

const emptyForm: ProfileForm = {
  displayName: "",
  location: "",
  preferredJobCategories: [],
};

function parsePreferredCategories(value: string | null) {
  if (!value) return [];

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function serializePreferredCategories(values: string[]) {
  return values.join(", ");
}

export default function JobSeekerProfilePage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [profile, setProfile] = useState<JobSeekerProfile | null>(null);
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadProfile() {
    setError("");

    try {
      const data = await getMyJobSeekerProfile();
      setProfile(data);
      setForm({
        displayName: data.displayName ?? "",
        location: data.location ?? "",
        preferredJobCategories: parsePreferredCategories(
          data.preferredJobCategories,
        ),
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSaving(true);

    try {
      const updatedProfile = await updateMyJobSeekerProfile({
        displayName: form.displayName.trim(),
        location: form.location.trim(),
        preferredJobCategories: serializePreferredCategories(
          form.preferredJobCategories,
        ),
      });

      setProfile(updatedProfile);
      setForm({
        displayName: updatedProfile.displayName ?? "",
        location: updatedProfile.location ?? "",
        preferredJobCategories: parsePreferredCategories(
          updatedProfile.preferredJobCategories,
        ),
      });
      setSuccess("Profile updated successfully.");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteAccount(e: React.FormEvent) {
    e.preventDefault();
    setDeleteError("");
    setSuccess("");

    if (!deletePassword.trim()) {
      setDeleteError("Please confirm your password.");
      return;
    }

    const confirmed = window.confirm(
      "This permanently deletes your account, CV, tags, and contact history. This action cannot be undone.",
    );

    if (!confirmed) return;

    setIsDeletingAccount(true);

    try {
      const response = await deleteAccount({
        password: deletePassword,
      });
      await logout();
      navigate("/login", {
        replace: true,
        state: {
          message: response.message,
        },
      });
    } catch (err: any) {
      setDeleteError(
        err?.response?.data?.message || "Failed to delete account",
      );
    } finally {
      setIsDeletingAccount(false);
    }
  }

  return (
    <DashboardLayout
      title="Profile"
      subtitle="Keep your candidate details current so employers can better understand your fit."
    >
      <div className="space-y-6">
        {!profile?.user.isVerified && !isLoading ? (
          <EmployerVerificationNotice />
        ) : null}
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <Card>
            <p className="text-sm font-medium text-slate-500">
              Profile details
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              Candidate profile
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Update your display name, location, and preferred job categories.
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
              <p className="mt-6 text-sm text-slate-500">Loading profile...</p>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <TextInput
                  label="Display name"
                  value={form.displayName}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      displayName: e.target.value,
                    }))
                  }
                  placeholder="Abdul-Kerim Spreco"
                />

                <TextInput
                  label="Location"
                  value={form.location}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, location: e.target.value }))
                  }
                  placeholder="Sarajevo"
                />

                <ChipInput
                  label="Preferred job categories"
                  values={form.preferredJobCategories}
                  onChange={(values) =>
                    setForm((prev) => ({
                      ...prev,
                      preferredJobCategories: values,
                    }))
                  }
                  placeholder="Type a category and press Enter"
                  maxItems={8}
                />

                <Button type="submit" disabled={isSaving} fullWidth={false}>
                  {isSaving ? "Saving..." : "Save profile"}
                </Button>
              </form>
            )}
          </Card>

          <Card>
            <p className="text-sm font-medium text-slate-500">
              Account summary
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              Account status
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Your sign-in email stays managed at the account level.
            </p>

            {isLoading ? (
              <p className="mt-6 text-sm text-slate-500">
                Loading account data...
              </p>
            ) : profile ? (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <InfoItem label="Email" value={profile.user.email} />
                  <VerificationInfoItem isVerified={profile.user.isVerified} />
                  <InfoItem
                    label="Created"
                    value={formatDate(profile.createdAt)}
                  />
                  <InfoItem
                    label="Last updated"
                    value={formatDate(profile.updatedAt)}
                  />
                </div>
              </div>
            ) : null}
          </Card>

          <Card>
            <p className="text-sm font-medium text-rose-600">Danger zone</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              Delete account
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              This permanently deletes your account, CV, tags, and contact
              request history. You will be logged out immediately.
            </p>

            {deleteError ? (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {deleteError}
              </div>
            ) : null}

            <form onSubmit={handleDeleteAccount} className="mt-6 space-y-5">
              <TextInput
                label="Confirm password"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Enter your password"
              />

              <Button
                type="submit"
                disabled={isDeletingAccount}
                fullWidth={false}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeletingAccount ? "Deleting account..." : "Delete account"}
              </Button>
            </form>
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

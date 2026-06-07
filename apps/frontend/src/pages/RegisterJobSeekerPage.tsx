import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/auth/AuthContext";
import AuthLayout from "../components/layout/AuthLayout";
import Button from "../components/ui/Button";
import TextInput from "../components/ui/TextInput";
import ChipInput from "../components/ui/ChipInput";

function serializePreferredCategories(values: string[]) {
  return values.join(", ");
}

export default function RegisterJobSeekerPage() {
  const { registerJobSeeker } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
    displayName: "",
    location: "",
    preferredJobCategories: [] as string[],
    acceptedTermsAndPrivacy: false,
  });

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmitRegisterJobSeeker(e: React.SubmitEvent) {
    e.preventDefault();
    setError("");

    if (!form.acceptedTermsAndPrivacy) {
      setError("You must accept the Terms of Service and Privacy Policy.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await registerJobSeeker({
        ...form,
        preferredJobCategories: serializePreferredCategories(
          form.preferredJobCategories,
        ),
      });
      navigate("/verify-email-sent", {
        state: {
          email: form.email,
          deliveryMethod: response.deliveryMethod,
          verificationPreviewUrl: response.verificationPreviewUrl,
          role: "JOB_SEEKER",
        },
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Create a job seeker account"
      subtitle="Upload your CV, manage visibility, and get discovered by employers."
    >
      <form onSubmit={handleSubmitRegisterJobSeeker} className="space-y-5">
        <TextInput
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, email: e.target.value }))
          }
        />

        <TextInput
          label="Password"
          type="password"
          placeholder="Password1!"
          value={form.password}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, password: e.target.value }))
          }
        />

        <TextInput
          label="Display name"
          type="text"
          placeholder="Abdul-Kerim Sprečo"
          value={form.displayName}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, displayName: e.target.value }))
          }
        />

        <TextInput
          label="Location"
          type="text"
          placeholder="Sarajevo"
          value={form.location}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, location: e.target.value }))
          }
        />

        <ChipInput
          label="Preferred job categories"
          placeholder="Type a category and press Enter"
          values={form.preferredJobCategories}
          onChange={(values) =>
            setForm((prev) => ({
              ...prev,
              preferredJobCategories: values,
            }))
          }
          maxItems={8}
        />

        <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.acceptedTermsAndPrivacy}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                acceptedTermsAndPrivacy: e.target.checked,
              }))
            }
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-300"
          />
          <span>
            I accept the{" "}
            <Link
              to="/terms"
              className="font-medium text-slate-900 underline underline-offset-4"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              to="/privacy"
              className="font-medium text-slate-900 underline underline-offset-4"
            >
              Privacy Policy
            </Link>
            .
          </span>
        </label>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-slate-600">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-medium text-slate-900 underline underline-offset-4"
        >
          Login
        </Link>
      </p>
    </AuthLayout>
  );
}

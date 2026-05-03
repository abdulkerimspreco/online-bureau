import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/auth/AuthContext";
import AuthLayout from "../components/layout/AuthLayout";
import Button from "../components/ui/Button";
import TextInput from "../components/ui/TextInput";

export default function RegisterEmployerPage() {
  const { registerEmployer } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
    companyName: "",
    description: "",
    website: "",
    industry: "",
    companySize: "",
    acceptedTermsAndPrivacy: false,
  });

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmitEmployer(e: React.SubmitEvent) {
    e.preventDefault();
    setError("");

    if (!form.acceptedTermsAndPrivacy) {
      setError("You must accept the Terms of Service and Privacy Policy.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await registerEmployer(form);
      navigate("/verify-email-sent", {
        state: {
          email: form.email,
          verificationPreviewUrl: response.verificationPreviewUrl,
          role: "EMPLOYER",
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
      title="Create an employer account"
      subtitle="Build your company profile and start discovering candidates."
    >
      <form onSubmit={handleSubmitEmployer} className="space-y-5">
        <TextInput
          label="Business email"
          type="email"
          placeholder="hr@company.com"
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
          label="Company name"
          type="text"
          placeholder="Online Bureau Ltd"
          value={form.companyName}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, companyName: e.target.value }))
          }
        />

        <TextInput
          label="Description"
          type="text"
          placeholder="We hire fullstack engineers"
          value={form.description}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, description: e.target.value }))
          }
        />

        <TextInput
          label="Website"
          type="text"
          placeholder="https://example.com"
          value={form.website}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, website: e.target.value }))
          }
        />

        <TextInput
          label="Industry"
          type="text"
          placeholder="Software"
          value={form.industry}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, industry: e.target.value }))
          }
        />

        <TextInput
          label="Company size"
          type="text"
          placeholder="11-50"
          value={form.companySize}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, companySize: e.target.value }))
          }
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
          {isSubmitting ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-sm text-slate-600">
        Already have an account?{" "}
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

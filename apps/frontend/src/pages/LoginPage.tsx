import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/auth/AuthContext";
import AuthLayout from "../components/layout/AuthLayout";
import Button from "../components/ui/Button";
import TextInput from "../components/ui/TextInput";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmitLogin(e: React.SubmitEvent) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login(form);
      navigate("/");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to continue to your Online Bureau dashboard."
    >
      <form onSubmit={handleSubmitLogin} className="space-y-5">
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
          placeholder="Enter your password"
          value={form.password}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, password: e.target.value }))
          }
        />

        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-slate-900 underline underline-offset-4"
          >
            Forgot Password?
          </Link>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Logging in..." : "Login"}
        </Button>
      </form>

      <div className="mt-6 space-y-2 text-sm text-slate-600">
        <p>
          Register as a{" "}
          <Link
            to="/register/job-seeker"
            className="font-medium text-slate-900 underline underline-offset-4"
          >
            Job Seeker
          </Link>
        </p>
        <p>
          Register as an{" "}
          <Link
            to="/register/employer"
            className="font-medium text-slate-900 underline underline-offset-4"
          >
            Employer
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

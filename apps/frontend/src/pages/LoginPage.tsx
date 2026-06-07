import { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/auth/AuthContext";
import AuthLayout from "../components/layout/AuthLayout";
import Button from "../components/ui/Button";
import TextInput from "../components/ui/TextInput";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState(
    (location.state as { message?: string } | null)?.message ?? "",
  );
  const [deletionReceiptCode, setDeletionReceiptCode] = useState(
    (location.state as { deletionReceiptCode?: string } | null)?.deletionReceiptCode ?? "",
  );
  const [deletionCompletedAt, setDeletionCompletedAt] = useState(
    (location.state as { deletionCompletedAt?: string } | null)?.deletionCompletedAt ?? "",
  );
  const [deletionSummary, setDeletionSummary] = useState(
    (location.state as { deletionSummary?: string } | null)?.deletionSummary ?? "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const stateMessage = (location.state as { message?: string } | null)?.message;

    if (stateMessage) {
      setMessage(stateMessage);
      setDeletionReceiptCode(
        (location.state as { deletionReceiptCode?: string } | null)
          ?.deletionReceiptCode ?? "",
      );
      setDeletionCompletedAt(
        (location.state as { deletionCompletedAt?: string } | null)
          ?.deletionCompletedAt ?? "",
      );
      setDeletionSummary(
        (location.state as { deletionSummary?: string } | null)
          ?.deletionSummary ?? "",
      );
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  async function handleSubmitLogin(e: React.SubmitEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setDeletionReceiptCode("");
    setDeletionCompletedAt("");
    setDeletionSummary("");
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

        {message ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <p className="font-medium">{message}</p>
            {deletionSummary ? (
              <p className="mt-2">{deletionSummary}</p>
            ) : null}
            {deletionReceiptCode ? (
              <div className="mt-3 rounded-xl border border-emerald-200 bg-white/70 px-3 py-2 text-xs text-emerald-900">
                <p className="font-semibold">Deletion receipt</p>
                <p className="mt-1">Reference: {deletionReceiptCode}</p>
                {deletionCompletedAt ? (
                  <p className="mt-1">Completed: {new Date(deletionCompletedAt).toLocaleString()}</p>
                ) : null}
              </div>
            ) : null}
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

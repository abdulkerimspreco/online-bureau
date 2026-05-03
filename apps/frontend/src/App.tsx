import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/auth/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import RegisterJobSeekerPage from "./pages/RegisterJobSeekerPage";
import RegisterEmployerPage from "./pages/RegisterEmployerPage";
import JobSeekerDashboardPage from "./pages/JobSeekerDashboardPage";
import EmployerDashboardPage from "./pages/EmployerDashboardPage";
import CvPage from "./pages/CvPage";
import TagsPage from './pages/TagsPage';
import JobSeekerProfilePage from './pages/JobSeekerProfilePage';
import EmployerProfilePage from './pages/EmployerProfilePage';
import TermsPage from './pages/TermsPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import VerifyEmailSentPage from './pages/VerifyEmailSentPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import EmployerSearchPage from './pages/EmployerSearchPage';

function HomeRedirect() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div style={{ padding: "2rem" }}>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === "JOB_SEEKER") {
    return <Navigate to="/job-seeker/dashboard" replace />;
  }

  if (user?.role === "EMPLOYER") {
    return <Navigate to="/employer/dashboard" replace />;
  }

  return <div style={{ padding: "2rem" }}>Unknown role</div>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register/job-seeker" element={<RegisterJobSeekerPage />} />
      <Route path="/register/employer" element={<RegisterEmployerPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/verify-email-sent" element={<VerifyEmailSentPage />} />

      <Route element={<ProtectedRoute allowedRoles={["JOB_SEEKER"]} />}>
        <Route
          path="/job-seeker/dashboard"
          element={<JobSeekerDashboardPage />}
        />
        <Route
          path="/job-seeker/profile"
          element={<JobSeekerProfilePage />}
        />
        <Route path="/job-seeker/cv" element={<CvPage />} />
        <Route path="/job-seeker/tags" element={<TagsPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["EMPLOYER"]} />}>
        <Route path="/employer/dashboard" element={<EmployerDashboardPage />} />
        <Route path="/employer/profile" element={<EmployerProfilePage />} />
        <Route path="/employer/search" element={<EmployerSearchPage />} />
      </Route>
    </Routes>
  );
}

import { Link } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import Section from '../components/ui/Section';
import { useAuth } from '../context/auth/AuthContext';
import VerificationBadge from '../components/ui/VerificationBadge';
import EmployerVerificationNotice from '../components/ui/EmployerVerificationNotice';

export default function EmployerDashboardPage() {
  const { user } = useAuth();

  return (
    <DashboardLayout
      title="Overview"
      subtitle="Your employer workspace for managing company information and discovering candidates."
    >
      <div className="space-y-6">
        {!user?.isVerified ? <EmployerVerificationNotice /> : null}

        <Section
          title="Account summary"
          description="Basic information about your employer account."
        >
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Email
              </p>
              <p className="mt-2 text-sm font-medium text-slate-900">
                {user?.email}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Role
              </p>
              <p className="mt-2 text-sm font-medium text-slate-900">
                {user?.role}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Verification
              </p>
              <div className="mt-2">
                <VerificationBadge isVerified={Boolean(user?.isVerified)} />
              </div>
            </div>
          </div>
        </Section>

        <Section
          title="Employer setup"
          description="Prepare your company profile before contacting candidates."
        >
          <div className="divide-y divide-slate-200">
            <DashboardAction
              title="Complete company profile"
              description="Add company name, industry, size, website, and description."
              to="/employer/profile"
            />
            <DashboardAction
              title="Search candidates"
              description="Find visible CVs by tags, keywords, and location."
              to="/employer/search"
            />
          </div>
        </Section>

        <Section
          title="Upcoming modules"
          description="These features will complete the employer workflow."
        >
          <div className="grid gap-4 md:grid-cols-3">
            <InfoBlock title="Contact requests" text="Send controlled contact requests to candidates." />
            <InfoBlock title="Saved searches" text="Save and rerun candidate search filters." />
            <InfoBlock title="Shortlist" text="Save promising candidate profiles for later." />
          </div>
        </Section>
      </div>
    </DashboardLayout>
  );
}

function DashboardAction({
  title,
  description,
  to,
}: {
  title: string;
  description: string;
  to: string;
}) {
  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h4 className="text-sm font-semibold text-slate-950">{title}</h4>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>

      <Link
        to={to}
        className="inline-flex w-fit rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
      >
        Open
      </Link>
    </div>
  );
}

function InfoBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <h4 className="text-sm font-semibold text-slate-950">{title}</h4>
      <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
    </div>
  );
}

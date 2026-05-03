import { Link } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import Section from '../components/ui/Section';
import { useAuth } from '../context/auth/AuthContext';

export default function JobSeekerDashboardPage() {
  const { user } = useAuth();

  return (
    <DashboardLayout
      title="Overview"
      subtitle="Your candidate workspace for managing profile visibility, CV uploads, and discoverability."
    >
      <div className="space-y-6">
        <Section
          title="Account summary"
          description="Basic information about your current session."
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
              <p className="mt-2 text-sm font-medium text-slate-900">
                {user?.isVerified ? 'Verified' : 'Not verified'}
              </p>
            </div>
          </div>
        </Section>

        <Section
          title="Candidate setup"
          description="Complete these steps to make your profile useful for employers."
        >
          <div className="divide-y divide-slate-200">
            <DashboardAction
              title="Complete your profile"
              description="Update your display name, location, and preferred categories."
              to="/job-seeker/profile"
            />
            <DashboardAction
              title="Upload your CV"
              description="Upload or replace your current CV and manage privacy settings."
              to="/job-seeker/cv"
            />
            <DashboardAction
              title="Attach tags"
              description="Add skills and role tags to improve employer search results."
              to="/job-seeker/tags"
            />
          </div>
        </Section>

        <Section
          title="Upcoming modules"
          description="These features are planned for the next backend/frontend iteration."
        >
          <div className="grid gap-4 md:grid-cols-3">
            <InfoBlock title="Contact requests" text="Employers will request access to your contact details." />
            <InfoBlock title="Notifications" text="Track CV updates, profile changes, and employer activity." />
            <InfoBlock title="AI review" text="Optional CV review and improvement suggestions." />
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
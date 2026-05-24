import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { getUnreadNotificationCount } from '../../api/notifications/notifications.api';
import { useAuth } from '../../context/auth/AuthContext';
import VerificationBadge from '../ui/VerificationBadge';

interface DashboardLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

type NavItem = {
  label: string;
  to: string;
  notificationAware?: boolean;
};

const jobSeekerNav: NavItem[] = [
  { label: 'Overview', to: '/job-seeker/dashboard' },
  { label: 'Profile', to: '/job-seeker/profile' },
  { label: 'Privacy', to: '/job-seeker/privacy' },
  { label: 'My CV', to: '/job-seeker/cv' },
  { label: 'Tags', to: '/job-seeker/tags' },
  { label: 'Requests', to: '/job-seeker/requests' },
  { label: 'Notifications', to: '/job-seeker/notifications', notificationAware: true },
];

const employerNav: NavItem[] = [
  { label: 'Overview', to: '/employer/dashboard' },
  { label: 'Company Profile', to: '/employer/profile' },
  { label: 'Candidate Search', to: '/employer/search' },
  { label: 'Requests', to: '/employer/requests' },
  { label: 'Shortlist', to: '/employer/shortlist' },
  { label: 'Notifications', to: '/employer/notifications', notificationAware: true },
];

export default function DashboardLayout({
  title,
  subtitle,
  children,
}: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const navItems = user?.role === 'EMPLOYER' ? employerNav : jobSeekerNav;

  useEffect(() => {
    let isActive = true;

    async function loadUnreadCount() {
      try {
        const response = await getUnreadNotificationCount();
        if (isActive) {
          setUnreadCount(response.count);
        }
      } catch {
        if (isActive) {
          setUnreadCount(0);
        }
      }
    }

    loadUnreadCount();

    const refreshHandler = () => {
      loadUnreadCount();
    };

    window.addEventListener('notifications:changed', refreshHandler);

    return () => {
      isActive = false;
      window.removeEventListener('notifications:changed', refreshHandler);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-200 bg-white lg:flex lg:flex-col">
        <div className="border-b border-slate-200 px-6 py-5">
          <Link to="/" className="block">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
              Online Bureau
            </p>
            <h1 className="mt-1 text-xl font-semibold text-slate-950">
              Workspace
            </h1>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-4 py-5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                `flex items-center rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? 'bg-slate-950 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span>{item.label}</span>
                  {item.notificationAware && unreadCount > 0 ? (
                    <span
                      className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {unreadCount}
                    </span>
                  ) : null}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-4">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="truncate text-sm font-medium text-slate-900">
              {user?.email}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                {user?.role}
              </p>
              <VerificationBadge isVerified={Boolean(user?.isVerified)} />
            </div>

            <button
              onClick={logout}
              className="mt-4 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="flex items-center justify-between px-5 py-4 lg:px-8">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                {user?.role === 'EMPLOYER' ? 'Employer Portal' : 'Candidate Portal'}
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">
                {title}
              </h2>
            </div>

            <button
              onClick={logout}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 lg:hidden"
            >
              Logout
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto border-t border-slate-100 px-5 py-3 lg:hidden">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${
                    isActive
                      ? 'bg-slate-950 text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`
                }
              >
                <span>{item.label}</span>
                {item.notificationAware && unreadCount > 0 ? (
                  <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                    {unreadCount}
                  </span>
                ) : null}
              </NavLink>
            ))}
          </div>
        </header>

        <main className="px-5 py-8 lg:px-8">
          {subtitle ? (
            <p className="mb-6 max-w-3xl text-sm leading-6 text-slate-500">
              {subtitle}
            </p>
          ) : null}

          {children}
        </main>
      </div>
    </div>
  );
}

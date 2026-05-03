import LegalPageLayout from './LegalPageLayout';

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout title="Privacy Policy" updatedOn="April 26, 2026">
      <section>
        <h2 className="text-base font-semibold text-slate-950">Data we collect</h2>
        <p className="mt-2">
          Online Bureau currently collects account details, profile information,
          uploaded CV metadata, employer profile information, and the minimum data
          needed to operate the platform.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-slate-950">How data is used</h2>
        <p className="mt-2">
          We use account and profile data to authenticate users, display relevant
          dashboards, support candidate discovery features, and maintain core
          platform functionality for this academic project.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-slate-950">
          CV and profile privacy
        </h2>
        <p className="mt-2">
          Candidate visibility settings affect whether a CV is intended to appear
          in employer-facing flows. This milestone is still under development, so
          privacy controls should be treated as part of an in-progress system
          rather than a finished legal or security program.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-slate-950">
          Access, correction, and deletion
        </h2>
        <p className="mt-2">
          Users can already update core profile information in the application.
          Additional data access and deletion workflows are planned as part of the
          broader GDPR-related scope described in the project documentation.
        </p>
      </section>
    </LegalPageLayout>
  );
}

import LegalPageLayout from './LegalPageLayout';

export default function TermsPage() {
  return (
    <LegalPageLayout title="Terms of Service" updatedOn="April 26, 2026">
      <section>
        <h2 className="text-base font-semibold text-slate-950">Platform use</h2>
        <p className="mt-2">
          Online Bureau is a student project platform for candidate CV management
          and employer discovery workflows. You agree to use the platform lawfully
          and to provide accurate account and profile information.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-slate-950">
          Account responsibility
        </h2>
        <p className="mt-2">
          You are responsible for activity performed through your account and for
          keeping your credentials private. You should not upload content you do
          not have the right to share.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-slate-950">Acceptable content</h2>
        <p className="mt-2">
          CVs, company profiles, tags, and messages must not contain illegal,
          abusive, misleading, or infringing content. Platform administrators may
          remove content or restrict access while project moderation features are
          still being completed.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-slate-950">
          Project status disclaimer
        </h2>
        <p className="mt-2">
          This release is an academic milestone build and may contain incomplete
          features, temporary workflows, or non-production safeguards while the
          project is under active development.
        </p>
      </section>
    </LegalPageLayout>
  );
}

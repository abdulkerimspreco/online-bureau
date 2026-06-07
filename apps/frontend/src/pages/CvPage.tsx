import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import {
  deleteMyCv,
  getMyCv,
  updateCvVisibility,
  uploadCv,
} from "../api/cv/cv.api";
import type { CV } from "../api/cv/cv.types";
import {
  createCvReview,
  getLatestCvReview,
} from "../api/cv-review/cv-review.api";
import type { CvReviewResult } from "../api/cv-review/cv-review.types";
import { formatBytes, formatDate } from "../utils/functionUtils";

export default function CvPage() {
  const [cv, setCv] = useState<CV | null>(null);
  const [review, setReview] = useState<CvReviewResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadCvState() {
    setError("");

    try {
      const [data, latestReview] = await Promise.all([
        getMyCv(),
        getLatestCvReview().catch((err: any) => {
          if (err?.response?.status === 404) {
            return null;
          }

          throw err;
        }),
      ]);
      setCv(data);
      setReview(latestReview);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setCv(null);
        setReview(null);
      } else {
        setError(err?.response?.data?.message || "Failed to load CV");
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCvState();
  }, []);

  const isVisible = useMemo(() => cv?.visibility === "PUBLIC", [cv]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedFile) {
      setError("Please choose a file first.");
      return;
    }

    setError("");
    setSuccess("");
    setIsUploading(true);

    try {
      const uploadedCv = await uploadCv(selectedFile);
      setCv(uploadedCv);
      setReview(null);
      setSelectedFile(null);
      setSuccess(
        cv ? "CV replaced successfully." : "CV uploaded successfully.",
      );
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to upload CV");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleVisibilityChange(
    nextVisibility: "PRIVATE" | "PUBLIC" | "COMPANY_ONLY",
  ) {
    if (!cv) return;

    setError("");
    setSuccess("");
    setIsUpdatingVisibility(true);

    try {
      const updatedCv = await updateCvVisibility(nextVisibility);
      setCv(updatedCv);
      setSuccess(`CV visibility changed to ${nextVisibility}.`);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update visibility");
    } finally {
      setIsUpdatingVisibility(false);
    }
  }

  async function handleDelete() {
    if (!cv) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete your CV?",
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");
    setIsDeleting(true);

    try {
      await deleteMyCv();
      setCv(null);
      setReview(null);
      setSelectedFile(null);
      setSuccess("CV deleted successfully.");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to delete CV");
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleAiReview() {
    if (!cv) return;

    setError("");
    setSuccess("");
    setIsReviewing(true);

    try {
      const result = await createCvReview();
      setReview(result);
      setSuccess(
        "AI review completed. We saved only the structured feedback for this run.",
      );
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to review CV");
    } finally {
      setIsReviewing(false);
    }
  }

  return (
    <DashboardLayout
      title="My CV"
      subtitle="Upload, replace, delete, and control the visibility of your CV."
    >
      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Current CV status
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                {cv ? "CV uploaded" : "No CV uploaded yet"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {cv
                  ? "Your current CV is stored and ready to be managed."
                  : "Upload your CV to start building your candidate presence."}
              </p>
            </div>

            <div
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                cv
                  ? isVisible
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {!cv ? "EMPTY" : cv.visibility}{" "}
            </div>
          </div>

          {error ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          ) : null}

          <div className="mt-6">
            {isLoading ? (
              <p className="text-sm text-slate-500">Loading CV data...</p>
            ) : cv ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        File name
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-900">
                        {cv.fileName}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        File size
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-900">
                        {formatBytes(cv.fileSize)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Uploaded
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-900">
                        {formatDate(cv.createdAt)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Last updated
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-900">
                        {formatDate(cv.updatedAt)}
                      </p>
                    </div>
                  </div>

                  <a
                    href={`http://localhost:3000${cv.fileUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex text-sm font-medium text-slate-900 underline underline-offset-4"
                  >
                    Open current CV
                  </a>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={isUpdatingVisibility}
                    onClick={() =>
                      handleVisibilityChange(
                        cv.visibility === "PUBLIC" ? "PRIVATE" : "PUBLIC",
                      )
                    }
                    className={`rounded-2xl px-5 py-3 text-sm font-medium transition ${
                      isVisible
                        ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                        : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    {isUpdatingVisibility
                      ? "Updating visibility..."
                      : isVisible
                        ? "Set as Private"
                        : "Set as Public"}
                  </button>

                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={handleDelete}
                    className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isDeleting ? "Deleting..." : "Delete CV"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                No CV found for your account yet.
              </div>
            )}
          </div>
          </Card>

          <Card>
          <p className="text-sm font-medium text-slate-500">
            {cv ? "Replace your CV" : "Upload your CV"}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">
            {cv ? "Upload a new version" : "Upload your first CV"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Accepted formats: PDF, DOC, DOCX. Maximum size: 10MB.
          </p>

          <form onSubmit={handleUpload} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Choose file
              </span>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                className="block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
              />
            </label>

            {selectedFile ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                Selected:{" "}
                <span className="font-medium">{selectedFile.name}</span>
              </div>
            ) : null}

            <Button type="submit" disabled={isUploading}>
              {isUploading
                ? cv
                  ? "Replacing CV..."
                  : "Uploading CV..."
                : cv
                  ? "Replace CV"
                  : "Upload CV"}
            </Button>
          </form>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-800">
              Visibility meaning
            </p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>
                <span className="font-medium text-slate-800">Visible:</span>{" "}
                Employers can find your CV in search results.
              </li>
              <li>
                <span className="font-medium text-slate-800">Hidden:</span> Your
                CV stays stored, but does not appear in employer search.
              </li>
            </ul>
          </div>
          </Card>
        </div>

        <Card>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">AI CV review</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                Optional feedback on structure, clarity, keywords, and completeness
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Reviews run only when you request them. This app stores only the
                final feedback, not the raw CV text. OpenAI response storage is
                disabled for the request, and slow provider calls are canceled
                automatically so the page does not hang forever.
              </p>
            </div>

            <Button
              type="button"
              fullWidth={false}
              disabled={!cv || isReviewing}
              onClick={handleAiReview}
            >
              {isReviewing
                ? "Reviewing..."
                : review
                  ? "Review again"
                  : "Run AI review"}
            </Button>
          </div>

          {!cv ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
              Upload a CV before requesting a review.
            </div>
          ) : review ? (
            <div className="mt-6 space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <ScoreCard label="Structure" score={review.structureScore} />
                <ScoreCard label="Clarity" score={review.clarityScore} />
                <ScoreCard label="Keywords" score={review.keywordScore} />
                <ScoreCard label="Completeness" score={review.completenessScore} />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <p>
                  Reviewed {formatDate(review.createdAt)} against the CV version last
                  updated on {formatDate(review.sourceCvUpdatedAt)}.
                </p>
                <p className="mt-2">
                  Review mode: <span className="font-medium text-slate-800">opt-in</span>.
                  App raw-text storage:{" "}
                  <span className="font-medium text-slate-800">
                    {review.appStoresRawCvText ? "enabled" : "disabled"}
                  </span>
                  . Provider response storage:{" "}
                  <span className="font-medium text-slate-800">
                    {review.providerResponseStorage}
                  </span>
                  . Timeout safeguard:{" "}
                  <span className="font-medium text-slate-800">
                    {Math.round(review.requestTimeoutMs / 1000)}s
                  </span>
                  .
                </p>
                {!review.isCurrentVersion ? (
                  <p className="mt-2 text-amber-700">
                    This feedback is for an older CV version. Uploading a revised CV
                    clears the previous result so you can run a fresh review.
                  </p>
                ) : null}
                {review.keywordMatches.length > 0 ? (
                  <p className="mt-2">
                    Keyword matches spotted:{" "}
                    <span className="font-medium text-slate-800">
                      {review.keywordMatches.join(", ")}
                    </span>
                  </p>
                ) : null}
              </div>

              <div className="grid gap-4 xl:grid-cols-3">
                <ReviewList
                  title="Strengths"
                  items={review.strengths}
                  tone="emerald"
                />
                <ReviewList
                  title="Areas for Improvement"
                  items={review.improvements}
                  tone="amber"
                />
                <ReviewList
                  title="Suggestions"
                  items={review.suggestions}
                  tone="slate"
                />
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
              No review has been generated for this CV yet.
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}

function ScoreCard({ label, score }: { label: string; score: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{score}/5</p>
    </div>
  );
}

function ReviewList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "emerald" | "amber" | "slate";
}) {
  const toneClasses =
    tone === "emerald"
      ? "border-emerald-200 bg-emerald-50"
      : tone === "amber"
        ? "border-amber-200 bg-amber-50"
        : "border-slate-200 bg-slate-50";

  return (
    <div className={`rounded-2xl border p-4 ${toneClasses}`}>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-500" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

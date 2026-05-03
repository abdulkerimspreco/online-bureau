interface VerificationBadgeProps {
  isVerified: boolean;
}

export default function VerificationBadge({
  isVerified,
}: VerificationBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
        isVerified
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-amber-100 text-amber-800'
      }`}
    >
      {isVerified ? 'Verified' : 'Unverified'}
    </span>
  );
}

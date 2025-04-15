import Link from 'next/link';

export default function BackButton({ backUrl }: { backUrl: string }) {
  return (
    <Link href={backUrl} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        className="w-4 h-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 19.5L8.25 12l7.5-7.5"
        />
      </svg>
      <span>Back</span>
    </Link>
  );
}
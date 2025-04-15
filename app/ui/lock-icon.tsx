export default function LockIcon({ className = 'w-4 h-4 text-gray-400' }) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        viewBox="0 0 24 24"
        className={className}
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M12 1a5 5 0 00-5 5v3H6a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2v-9a2 2 0 00-2-2h-1V6a5 5 0 00-5-5zm-3 5a3 3 0 116 0v3H9V6zm-3 5h12v9H6v-9z"
          clipRule="evenodd"
        />
      </svg>
    );
  }
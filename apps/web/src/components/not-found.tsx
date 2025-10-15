import { Link } from '@tanstack/react-router';

export function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-9xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-4">
          404
        </h1>
        <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
          Page Not Found
        </h2>
        <p className="text-lg text-gray-400 mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-block px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-cyan-500/50"
        >
          Go Back Home
        </Link>
      </div>
    </div>
  );
}

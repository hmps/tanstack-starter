import { createFileRoute, Link } from '@tanstack/react-router';
import { signOut, useSession } from '@/lib/auth-client';

export const Route = createFileRoute('/')({
  component: App,
});

function App() {
  const { data: session, isPending } = useSession();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Auth header */}
      <header className="absolute top-0 right-0 p-6 flex items-center gap-4 z-10">
        {isPending ? (
          <div className="h-8 w-20 animate-pulse rounded bg-slate-700" />
        ) : session ? (
          <>
            <span className="text-gray-300 text-sm">{session.user.email}</span>
            <button
              type="button"
              onClick={() => signOut()}
              className="px-4 py-2 text-sm text-gray-300 hover:text-white border border-gray-600 hover:border-gray-500 rounded-lg transition-colors"
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link
              to="/sign-in"
              className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/sign-up"
              className="px-4 py-2 text-sm bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
            >
              Sign up
            </Link>
          </>
        )}
      </header>

      <section className="relative py-20 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10"></div>
        <div className="relative max-w-5xl mx-auto">
          <div className="flex items-center justify-center gap-6 mb-6">
            <h1 className="text-6xl md:text-7xl font-bold text-white">
              <span className="text-gray-300">TANSTACK</span>{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                START
              </span>
            </h1>
          </div>
          <p className="text-2xl md:text-3xl text-gray-300 mb-4 font-light">
            The framework for next generation AI applications
          </p>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto mb-8">
            Full-stack framework powered by TanStack Router for React and Solid.
            Build modern applications with server functions, streaming, and type
            safety.
          </p>
          <div className="flex flex-col items-center gap-4">
            <a
              href="https://tanstack.com/start"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-cyan-500/50"
            >
              Documentation
            </a>
            <p className="text-gray-400 text-sm mt-2">
              Begin your TanStack Start journey by editing{' '}
              <code className="px-2 py-1 bg-slate-700 rounded text-cyan-400">
                /src/routes/index.tsx
              </code>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

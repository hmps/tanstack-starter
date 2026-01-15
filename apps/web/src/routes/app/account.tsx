import { createFileRoute } from '@tanstack/react-router';
import { signOut, useSession } from '@/lib/auth-client';

/**
 * Account page - user profile and settings
 */
export const Route = createFileRoute('/app/account')({
  component: AccountPage,
});

function AccountPage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Account</h1>

        <div className="bg-slate-800 rounded-lg p-6 space-y-6">
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-400">Email</dt>
              <dd className="text-white">{session?.user.email}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-400">Name</dt>
              <dd className="text-white">{session?.user.name ?? 'Not set'}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-400">
                Member since
              </dt>
              <dd className="text-white">
                {session?.user.createdAt
                  ? new Date(session.user.createdAt).toLocaleDateString()
                  : 'Unknown'}
              </dd>
            </div>
          </dl>

          <hr className="border-slate-700" />

          <div className="flex gap-4">
            <a
              href="/"
              className="px-4 py-2 text-sm text-gray-300 hover:text-white border border-gray-600 hover:border-gray-500 rounded-lg transition-colors"
            >
              Back to home
            </a>
            <button
              type="button"
              onClick={() => signOut()}
              className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

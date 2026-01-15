import { createFileRoute, Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useSession } from '@/lib/auth-client';

export const Route = createFileRoute('/')({ component: App });

/**
 * Landing page with sign-in/sign-up links or account link if logged in
 */
function App() {
  const { data: session } = useSession();

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Welcome</CardTitle>
          <CardDescription>
            {session
              ? `Signed in as ${session.user.email}`
              : 'Sign in to your account or create a new one'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          {session ? (
            <Button render={<Link to="/app/account" />} className="flex-1">
              Account
            </Button>
          ) : (
            <>
              <Button render={<Link to="/sign-in" />} className="flex-1">
                Sign in
              </Button>
              <Button
                render={<Link to="/sign-up" />}
                variant="outline"
                className="flex-1"
              >
                Sign up
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { createFileRoute, Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { signOut, useSession } from '@/lib/auth-client';

export const Route = createFileRoute('/app/account')({
  component: AccountPage,
});

/**
 * Account page - user profile and settings
 */
function AccountPage() {
  const { data: session } = useSession();

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your profile information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Email
              </dt>
              <dd>{session?.user.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Name
              </dt>
              <dd>{session?.user.name ?? 'Not set'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Member since
              </dt>
              <dd>
                {session?.user.createdAt
                  ? new Date(session.user.createdAt).toLocaleDateString()
                  : 'Unknown'}
              </dd>
            </div>
          </dl>
        </CardContent>
        <Separator />
        <CardFooter className="gap-2 pt-4">
          <Button render={<Link to="/" />} variant="outline">
            Back to home
          </Button>
          <Button variant="destructive" onClick={() => signOut()}>
            Sign out
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

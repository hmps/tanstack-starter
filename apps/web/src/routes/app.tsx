import { createFileRoute, Outlet } from '@tanstack/react-router';
import { authMiddleware } from '@/lib/middleware/auth';

/**
 * Protected app layout - all routes under /app require authentication
 */
export const Route = createFileRoute('/app')({
  component: AppLayout,
  server: {
    middleware: [authMiddleware],
  },
});

function AppLayout() {
  return <Outlet />;
}

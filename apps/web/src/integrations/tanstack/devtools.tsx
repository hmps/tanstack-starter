import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';

export const TanstackQueryDevtools = {
  name: 'Tanstack Query',
  render: <ReactQueryDevtoolsPanel />,
};

export const TanstackRouterDevtools = {
  name: 'Tanstack Router',
  render: <TanStackRouterDevtoolsPanel />,
};

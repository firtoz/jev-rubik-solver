import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router';
import '../style.css';
export const Route = createRootRoute({
  head: () => ({
    links: [{ rel: 'icon', type: 'image/svg+xml', href: `${import.meta.env.BASE_URL}favicon.svg` }],
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'JEV / Cube Lab' },
    ],
  }),
  component: () => (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <Outlet />
        <Scripts />
      </body>
    </html>
  ),
});

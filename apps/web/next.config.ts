import path from 'node:path';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

// Container builds set NEXT_OUTPUT=standalone (apps/web/Dockerfile).
const standalone = process.env['NEXT_OUTPUT'] === 'standalone';

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  ...(standalone && {
    output: 'standalone',
    // Trace workspace packages from the monorepo root, not just this app.
    outputFileTracingRoot: path.join(process.cwd(), '../..'),
  }),
};

export default withNextIntl(config);

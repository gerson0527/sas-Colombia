/** @type {import('next').NextConfig} */
const isProduction = process.env.NODE_ENV === 'production';
const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL;

const connectSrc = [
  "'self'",
  'http://localhost:8000',
  'https://api.sas-colombia.com',
];
if (!isProduction && supabaseOrigin) {
  connectSrc.push(supabaseOrigin);
}

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      `connect-src ${connectSrc.join(' ')}`,
      "frame-ancestors 'none'",
    ].join('; '),
  },
];

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;

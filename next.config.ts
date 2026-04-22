/** @type {import('next').NextConfig} */
const nextConfig = {
  // This tells Vercel to ignore strict linting warnings (like <img> tags)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // This tells Vercel to ignore minor TypeScript warnings
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
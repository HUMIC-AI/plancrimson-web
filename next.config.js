/** @type {import('next').NextConfig} */
module.exports = {
  // turn off strict mode when running the three.js pages in development
  // since it causes the raycaster to misbehave
  reactStrictMode: true,
  images: {
    domains: ['lh3.googleusercontent.com', 'images.unsplash.com'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

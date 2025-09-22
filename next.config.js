/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'images.unsplash.com',
      'sample-videos.com'
    ],
    unoptimized: true
  }
};
module.exports = nextConfig;

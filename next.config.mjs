/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      { source: "/seminar", destination: "/seminar/index.html" },
      { source: "/artconcert", destination: "/artconcert/index.html" },
    ];
  },
};

export default nextConfig;

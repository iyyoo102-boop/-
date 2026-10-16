/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [{ source: "/seminar", destination: "/seminar/index.html" }];
  },
};

export default nextConfig;

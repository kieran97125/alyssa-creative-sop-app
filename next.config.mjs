/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingIncludes: {
    "/api/analyze-video": ["./node_modules/ffmpeg-static/**/*"],
  },
  /* config options here */
  reactCompiler: true,
};

export default nextConfig;

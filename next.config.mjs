/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";
const isCapacitor = process.env.NEXT_PUBLIC_TARGET === "capacitor";

// Capacitor serves files from a local file:// scheme, so basePath/assetPrefix
// must be empty. For GitHub Pages we use the repo subpath. For dev/local, none.
const basePath = isCapacitor
  ? ""
  : (process.env.NEXT_PUBLIC_BASE_PATH ?? (isProd ? "/nfc" : ""));

const nextConfig = {
  reactStrictMode: true,
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  basePath,
  assetPrefix: basePath || undefined,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
    NEXT_PUBLIC_TARGET: isCapacitor ? "capacitor" : "web",
  },
};

export default nextConfig;

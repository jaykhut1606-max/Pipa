import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Image optimization — ship modern formats by default and cache the
  // optimized variants for a year (Next's image loader content-addresses
  // the URL so a source change busts the cache).
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 365,
    deviceSizes: [360, 414, 480, 640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Per-route headers. /public/images and /public/icons are versioned by
  // commit so a long immutable cache is safe. The manifest is short-
  // cached so a metadata change shows up within a day.
  async headers() {
    return [
      {
        source: "/images/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/icons/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400" },
          { key: "Content-Type", value: "application/manifest+json" },
        ],
      },
    ];
  },
};

export default nextConfig;

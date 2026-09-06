import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: false,
  transpilePackages: [
    "@fullcalendar/react",
    "@fullcalendar/core",
    "@fullcalendar/daygrid",
    "@fullcalendar/timegrid",
    "@fullcalendar/interaction",
  ],
};

export default nextConfig;
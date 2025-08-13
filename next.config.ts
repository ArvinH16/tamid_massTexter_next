import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // allowedDevOrigins: [
  //   '*.ngrok-free.app',
  //   '*.ngrok.io'
  // ],
  serverExternalPackages: ['nodemailer'],
};

export default nextConfig;

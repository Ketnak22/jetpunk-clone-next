import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  "env": {
    "MAX_SVG_FILE_SIZE_KB": "768",
    "MAX_JSON_FILE_SIZE_KB": "128",
    "MAX_INPUT_LENGTH": "50",
  },
};

export default nextConfig;

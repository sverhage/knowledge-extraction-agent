import type { VercelRequest, VercelResponse } from "@vercel/node";
import { config, getConfigHealth } from "../lib/config";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({
    status: "ok",
    service: config.serviceName,
    release: config.release,
    environment: process.env.VERCEL_ENV ?? "local",
    ...getConfigHealth()
  });
}

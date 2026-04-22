import { handleServiceMagicLinkPost } from "@/lib/auth/service-magic-link";
import { jsonRateLimitOrNull } from "@/lib/rate-limit";
import { type NextRequest } from "next/server";

/** @deprecated Preferir POST /api/auth/magic-link — mesmo comportamento. */
export async function POST(request: NextRequest) {
  const limited = await jsonRateLimitOrNull(request, "api/auth/magic-link");
  if (limited) return limited;
  return handleServiceMagicLinkPost(request);
}

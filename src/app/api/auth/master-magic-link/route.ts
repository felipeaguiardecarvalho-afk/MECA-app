import { handleServiceMagicLinkPost } from "@/lib/auth/service-magic-link";
import { type NextRequest } from "next/server";

/** @deprecated Preferir POST /api/auth/magic-link — mesmo comportamento. */
export async function POST(request: NextRequest) {
  return handleServiceMagicLinkPost(request);
}

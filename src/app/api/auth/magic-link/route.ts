import { handleServiceMagicLinkPost } from "@/lib/auth/service-magic-link";
import { type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  return handleServiceMagicLinkPost(request);
}

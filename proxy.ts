import { auth } from "@/lib/auth/server";

export default auth.middleware();

export const config = {
  matcher: ["/dashboard/:path*"],
};

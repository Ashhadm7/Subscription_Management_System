import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/config";

/**
 * Route protection at the edge. Role checks are repeated inside every protected
 * layout and server action — middleware is convenience, not the security
 * boundary.
 */
export const { auth: middleware } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    authorized({ auth: session, request }) {
      const { pathname } = request.nextUrl;
      const role = session?.user?.role;
      const isSignedIn = Boolean(session?.user?.id);

      const isProtected = ["/admin", "/staff", "/portal", "/dashboard"].some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
      );
      if (!isProtected) return true;

      if (!isSignedIn) return false;

      const forbidden = () => Response.redirect(new URL("/forbidden", request.nextUrl));

      if (pathname === "/admin" || pathname.startsWith("/admin/")) {
        return role === "ADMIN" ? true : forbidden();
      }
      if (pathname === "/staff" || pathname.startsWith("/staff/")) {
        return role === "ADMIN" || role === "STAFF" ? true : forbidden();
      }
      if (pathname === "/portal" || pathname.startsWith("/portal/")) {
        return role === "CUSTOMER" ? true : forbidden();
      }

      return true;
    },
  },
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};

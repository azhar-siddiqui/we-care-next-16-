import { buttonVariants } from "@/components/ui/button";
import {
  generateAccessToken,
  generateRefreshToken,
  mapDbUserToLoggedInUser,
  revokeRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "@/lib/auth";
import { env } from "@/lib/env";
import prisma from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import { JSX } from "react";

export default async function MarketingNavigationLink(): Promise<JSX.Element> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const refreshToken = cookieStore.get("refresh_token")?.value;

  let isVerified = false;

  if (token) {
    try {
      const verified = await verifyAccessToken(token);
      isVerified = !!verified;
    } catch (error) {
      isVerified = false;
      console.error("Access token verification failed:", error);
    }
  }

  // If access token invalid, attempt refresh & rotation server-side
  if (!isVerified && refreshToken) {
    try {
      const verified = await verifyRefreshToken(refreshToken);
      if (verified) {
        const userId = verified.userId;
        const [keyAdmin, admin, usr] = await Promise.all([
          prisma.keyAdmin.findUnique({ where: { id: userId } }),
          prisma.admin.findUnique({ where: { id: userId } }),
          prisma.user.findUnique({ where: { id: userId } }),
        ]);

        const found = keyAdmin ?? admin ?? usr;
        const loggedInUser = mapDbUserToLoggedInUser(found);
        if (loggedInUser) {
          // rotate
          await revokeRefreshToken(verified.jti);
          const newRefresh = await generateRefreshToken(userId, {
            expiresIn: "30d",
          });
          const newAccess = await generateAccessToken(loggedInUser, "15m");

          // set cookies server-side
          cookieStore.set("token", newAccess, {
            path: "/",
            httpOnly: true,
            sameSite: "strict",
            secure: env.APP_ENV === "production",
            maxAge: 15 * 60,
          });
          cookieStore.set("refresh_token", newRefresh, {
            path: "/",
            httpOnly: true,
            sameSite: "strict",
            secure: env.APP_ENV === "production",
            maxAge: 30 * 24 * 60 * 60,
          });

          isVerified = true;
        }
      }
    } catch (error) {
      console.error("Refresh verification failed:", error);
      // do not redirect from component; show login link instead
    }
  }

  return isVerified ? (
    <Link
      href="/dashboard/default"
      className={cn(buttonVariants({ variant: "outline" }))}
    >
      Dashboard <ArrowRight className="size-4" />
    </Link>
  ) : (
    <Link href="/login" className={cn(buttonVariants({ variant: "default" }))}>
      Login
    </Link>
  );
}

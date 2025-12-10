import { buttonVariants } from "@/components/ui/button";
import { verifyToken } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { JSX } from "react";

export default async function MarketingNavigationLink(): Promise<JSX.Element> {
  const tokenCookie = (await cookies()).get("token");
  const token = tokenCookie?.value;

  let isVerified = false;

  if (token) {
    try {
      const verified = await verifyToken(token);
      isVerified = !!verified;
    } catch (error) {
      isVerified = false;
      console.error("Token verification failed:", error);
      redirect("/login");
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
    <Link href="/login" className={cn(buttonVariants({ variant: "outline" }))}>
      Login
    </Link>
  );
}

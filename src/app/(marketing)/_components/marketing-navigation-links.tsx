import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";

export default async function MarketingNavigationLink() {
  const token = (await cookies()).get("token");
  return token ? (
    <Link
      href="/dashboard"
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

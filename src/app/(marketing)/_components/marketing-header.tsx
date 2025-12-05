import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { FlaskConical } from "lucide-react";
import Link from "next/link";
import MarketingNavigationLink from "./marketing-navigation-links";

export default function MarketingHeader() {
  return (
    <header className="border-border bg-background/95 sticky top-0 z-50 border-b backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <FlaskConical className="text-primary size-4.5" />
          <span className="text-md font-medium">WeCare</span>
        </Link>

        <nav className="hidden items-center space-x-8 md:flex">
          <a
            href="#features"
            className="hover:text-primary cursor-pointer text-sm font-medium transition-colors"
          >
            Features
          </a>
          <a
            href="#benefits"
            className="hover:text-primary cursor-pointer text-sm font-medium transition-colors"
          >
            Benefits
          </a>
          <a
            href="#pricing"
            className="hover:text-primary cursor-pointer text-sm font-medium transition-colors"
          >
            Pricing
          </a>
          <a
            href="#contact"
            className="hover:text-primary cursor-pointer text-sm font-medium transition-colors"
          >
            Contact
          </a>
        </nav>

        <div className="flex items-center gap-4">
          <div className="border-primary rounded-full border shadow-2xl drop-shadow-lg">
            <AnimatedThemeToggler />
          </div>
          <MarketingNavigationLink />
        </div>
      </div>
    </header>
  );
}

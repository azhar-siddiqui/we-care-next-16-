import { ReactNode } from "react";

import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { UserProvider } from "@/context/user-context";
import { verifyToken } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { getPreference } from "@/server/server-action";
import {
  CONTENT_LAYOUT_VALUES,
  NAVBAR_STYLE_VALUES,
  SIDEBAR_COLLAPSIBLE_VALUES,
  SIDEBAR_VARIANT_VALUES,
  type ContentLayout,
  type NavbarStyle,
  type SidebarCollapsible,
  type SidebarVariant,
} from "@/types/preferences/layout";
import { cookies } from "next/headers";
import { AccountSwitcher } from "./_components/sidebar/account-switcher";
import { AnimatedThemeToggler } from "./_components/sidebar/animated-theme-toggler";
import { AppSidebarWrapper } from "./_components/sidebar/app-sidebar-wrapper";
import { LayoutControls } from "./_components/sidebar/layout-controls";
import { SearchDialog } from "./_components/sidebar/search-dialog";

export default async function Layout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";
  const token = cookieStore.get("token")?.value;

  const [
    tokenPayload,
    sidebarVariant,
    sidebarCollapsible,
    contentLayout,
    navbarStyle,
  ] = await Promise.all([
    token ? verifyToken(token) : null,
    getPreference<SidebarVariant>(
      "sidebar_variant",
      SIDEBAR_VARIANT_VALUES,
      "inset"
    ),
    getPreference<SidebarCollapsible>(
      "sidebar_collapsible",
      SIDEBAR_COLLAPSIBLE_VALUES,
      "icon"
    ),
    getPreference<ContentLayout>(
      "content_layout",
      CONTENT_LAYOUT_VALUES,
      "centered"
    ),
    getPreference<NavbarStyle>("navbar_style", NAVBAR_STYLE_VALUES, "scroll"),
  ]);

  const layoutPreferences = {
    contentLayout,
    variant: sidebarVariant,
    collapsible: sidebarCollapsible,
    navbarStyle,
  };

  // Normalize user to match UserProvider prop type LoggedInUser | null
  const user = tokenPayload?.loggedInUser ?? null;

  return (
    <UserProvider user={user}>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebarWrapper
          variant={sidebarVariant}
          collapsible={sidebarCollapsible}
        />
        <SidebarInset
          data-content-layout={contentLayout}
          suppressHydrationWarning
          className={cn(
            "data-[content-layout=centered]:mx-auto! data-[content-layout=centered]:max-w-screen-2xl",
            // Adds right margin for inset sidebar in centered layout up to 113rem.
            // On wider screens with collapsed sidebar, removes margin and sets margin auto for alignment.
            "max-[113rem]:peer-data-[variant=inset]:mr-2! min-[101rem]:peer-data-[variant=inset]:peer-data-[state=collapsed]:mr-auto!"
          )}
        >
          <header
            data-navbar-style={navbarStyle}
            suppressHydrationWarning
            className={cn(
              "flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12",
              // Handle sticky navbar style with conditional classes so blur, background, z-index, and rounded corners remain consistent across all SidebarVariant layouts.
              "data-[navbar-style=sticky]:bg-background/50 data-[navbar-style=sticky]:sticky data-[navbar-style=sticky]:top-0 data-[navbar-style=sticky]:z-50 data-[navbar-style=sticky]:overflow-hidden data-[navbar-style=sticky]:rounded-t-[inherit] data-[navbar-style=sticky]:backdrop-blur-md"
            )}
          >
            <div className="flex w-full items-center justify-between px-4 lg:px-6">
              <div className="flex items-center gap-1 lg:gap-2">
                <SidebarTrigger className="-ml-1" />
                <Separator
                  orientation="vertical"
                  className="mx-2 data-[orientation=vertical]:h-4"
                />
                <SearchDialog />
              </div>
              <div className="flex items-center gap-2">
                <LayoutControls {...layoutPreferences} />
                <AnimatedThemeToggler />
                <AccountSwitcher user={user} />
              </div>
            </div>
          </header>
          <div className="h-full p-4 md:p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </UserProvider>
  );
}

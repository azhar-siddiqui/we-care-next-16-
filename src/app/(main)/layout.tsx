import { ReactNode } from "react";

import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { UserProvider } from "@/context/user-context";
import {
  generateAccessToken,
  generateRefreshToken,
  revokeRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "@/lib/auth";
import { env } from "@/lib/env";
import prisma from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { getPreference } from "@/server/server-action";
import { Role, type LoggedInUser } from "@/types";
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
  const accessToken = cookieStore.get("token")?.value;
  const refreshToken = cookieStore.get("refresh_token")?.value;

  // Verify access token and fetch layout preferences in parallel
  const [
    accessPayload,
    sidebarVariant,
    sidebarCollapsible,
    contentLayout,
    navbarStyle,
  ] = await Promise.all([
    accessToken ? verifyAccessToken(accessToken) : null,
    getPreference<SidebarVariant>(
      "sidebar_variant",
      SIDEBAR_VARIANT_VALUES,
      "inset",
    ),
    getPreference<SidebarCollapsible>(
      "sidebar_collapsible",
      SIDEBAR_COLLAPSIBLE_VALUES,
      "icon",
    ),
    getPreference<ContentLayout>(
      "content_layout",
      CONTENT_LAYOUT_VALUES,
      "centered",
    ),
    getPreference<NavbarStyle>("navbar_style", NAVBAR_STYLE_VALUES, "scroll"),
  ]);

  let user: LoggedInUser | null = accessPayload?.loggedInUser ?? null;

  // If access token is missing/expired but a refresh token exists, attempt server-side refresh and rotation
  if (!user && refreshToken) {
    const verified = await verifyRefreshToken(refreshToken);
    if (verified) {
      const userId = verified.userId;

      // Attempt to find the user across possible tables
      const [keyAdmin, admin, usr] = await Promise.all([
        prisma.keyAdmin.findUnique({ where: { id: userId } }),
        prisma.admin.findUnique({ where: { id: userId } }),
        prisma.user.findUnique({ where: { id: userId } }),
      ]);

      const found = keyAdmin ?? admin ?? usr;
      if (found) {
        // Type-safe helpers that narrow unknown object shapes without using `any`
        const getName = (obj: unknown): string => {
          if (obj && typeof obj === "object") {
            if (
              "name" in obj &&
              typeof (obj as { name: unknown }).name === "string"
            ) {
              return (obj as { name: string }).name;
            }
            if (
              "ownerName" in obj &&
              typeof (obj as { ownerName: unknown }).ownerName === "string"
            ) {
              return (obj as { ownerName: string }).ownerName;
            }
          }
          return "";
        };

        const getEmail = (obj: unknown): string => {
          if (obj && typeof obj === "object") {
            if (
              "email" in obj &&
              typeof (obj as { email: unknown }).email === "string"
            ) {
              return (obj as { email: string }).email;
            }
            if (
              "username" in obj &&
              typeof (obj as { username: unknown }).username === "string"
            ) {
              return (obj as { username: string }).username;
            }
          }
          return "";
        };

        const getAvatar = (obj: unknown): string | undefined => {
          if (
            obj &&
            typeof obj === "object" &&
            "avatar" in obj &&
            typeof (obj as { avatar: unknown }).avatar === "string"
          ) {
            return (obj as { avatar: string }).avatar;
          }
          return undefined;
        };

        const getRole = (obj: unknown): Role => {
          if (
            obj &&
            typeof obj === "object" &&
            "role" in obj &&
            typeof (obj as { role: unknown }).role === "string"
          ) {
            return (obj as { role: Role }).role;
          }
          return Role.USER;
        };

        const loggedInUser: LoggedInUser = {
          id: found.id,
          name: getName(found),
          email: getEmail(found),
          avatar: getAvatar(found),
          role: getRole(found),
        };

        // Revoke the old refresh token and issue rotated tokens
        await revokeRefreshToken(verified.jti);
        const newRefresh = await generateRefreshToken(userId, {
          expiresIn: "30d",
        });
        const newAccess = await generateAccessToken(loggedInUser, "15m");

        // Persist cookies server-side (path, httpOnly, secure in prod, sameSite strict)
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

        user = loggedInUser;
      }
    }
  }

  const layoutPreferences = {
    contentLayout,
    variant: sidebarVariant,
    collapsible: sidebarCollapsible,
    navbarStyle,
  };

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
            "max-[113rem]:peer-data-[variant=inset]:mr-2! min-[101rem]:peer-data-[variant=inset]:peer-data-[state=collapsed]:mr-auto!",
          )}
        >
          <header
            data-navbar-style={navbarStyle}
            suppressHydrationWarning
            className={cn(
              "flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12",
              // Handle sticky navbar style with conditional classes so blur, background, z-index, and rounded corners remain consistent across all SidebarVariant layouts.
              "data-[navbar-style=sticky]:bg-background/50 data-[navbar-style=sticky]:sticky data-[navbar-style=sticky]:top-0 data-[navbar-style=sticky]:z-50 data-[navbar-style=sticky]:overflow-hidden data-[navbar-style=sticky]:rounded-t-[inherit] data-[navbar-style=sticky]:backdrop-blur-md",
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

"use client";

import Link from "next/link";
import React from "react";

import { Command } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { useUser } from "@/context/user-context";
import { sidebarItems, sidebarItemsForKeyUser } from "@/data/sidebar-data";
import { Role } from "@/types";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";

export const AppSidebar = React.memo(
  ({ ...props }: React.ComponentProps<typeof Sidebar>) => {
    const user = useUser();
    return (
      <Sidebar {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className="data-[slot=sidebar-menu-button]:p-1.5!"
              >
                <Link prefetch={false} href="/">
                  <Command />
                  <span className="text-base font-semibold">WeCare</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent className="gap-0">
          {user?.role === Role.KEY_ADMIN ? (
            <NavMain items={sidebarItemsForKeyUser} />
          ) : (
            <NavMain items={sidebarItems} />
          )}
          {/* <`NavDocuments` items={data.documents} /> */}
          {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={user} />
        </SidebarFooter>
      </Sidebar>
    );
  },
);

AppSidebar.displayName = "AppSidebar";

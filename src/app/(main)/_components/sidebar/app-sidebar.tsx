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

import { sidebarItemsForKeyUser } from "@/data/sidebar-data";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";

export const AppSidebar = React.memo(
  ({ ...props }: React.ComponentProps<typeof Sidebar>) => {
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
          {/* <NavMain items={sidebarItems} /> */}
          <NavMain items={sidebarItemsForKeyUser} />
          {/* <`NavDocuments` items={data.documents} /> */}
          {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
        </SidebarContent>
        <SidebarFooter>
          <NavUser />
        </SidebarFooter>
      </Sidebar>
    );
  }
);

AppSidebar.displayName = "AppSidebar";

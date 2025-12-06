"use client";

import Link from "next/link";

import {
  Command
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { sidebarItems } from "@/data/sidebar-data";
import { user } from "@/types";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";

//  const data = {
//   navSecondary: [
//     {
//       title: "Settings",
//       url: "#",
//       icon: Settings,
//     },
//     {
//       title: "Get Help",
//       url: "#",
//       icon: CircleHelp,
//     },
//     {
//       title: "Search",
//       url: "#",
//       icon: Search,
//     },
//   ],
//   documents: [
//     {
//       name: "Data Library",
//       url: "#",
//       icon: Database,
//     },
//     {
//       name: "Reports",
//       url: "#",
//       icon: ClipboardList,
//     },
//     {
//       name: "Word Assistant",
//       url: "#",
//       icon: File,
//     },
//   ],
// };
//

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
        <NavMain items={sidebarItems} />
        {/* <NavDocuments items={data.documents} /> */}
        {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}

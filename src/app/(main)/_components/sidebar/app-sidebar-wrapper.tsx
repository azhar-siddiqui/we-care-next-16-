// "use client";

import { SidebarCollapsible, SidebarVariant } from "@/types/preferences/layout";
import { AppSidebar } from "./app-sidebar";
// import dynamic from "next/dynamic";

// const AppSidebar = dynamic(
//   () =>
//     import("./app-sidebar").then((mod) => ({
//       default: mod.AppSidebar,
//     })),
//   {
//     ssr: true,
//   },
// );

interface AppSidebarWrapperProps {
  variant: SidebarVariant;
  collapsible: SidebarCollapsible;
}

export function AppSidebarWrapper({
  variant,
  collapsible,
}: AppSidebarWrapperProps) {
  return <AppSidebar variant={variant} collapsible={collapsible} />;
}

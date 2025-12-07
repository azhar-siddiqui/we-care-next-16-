"use client";
import { BadgeCheck, Bell, CreditCard, LogOut } from "lucide-react";

import { logoutApiAction } from "@/actions/auth/logout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, getInitialsFallbackName } from "@/lib/utils";
import { LoggedInUser } from "@/types";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

export function AccountSwitcher({ user }: { user: LoggedInUser | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      const response = await logoutApiAction();
      if (response.success) {
        toast.success(`${response.message}`);
        router.replace("/login");
      } else {
        toast.error(JSON.stringify(response.error));
      }
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="size-9 rounded-lg">
          {user?.avatar && (
            <AvatarImage src={user.avatar || undefined} alt={user.name} />
          )}
          <AvatarFallback className="rounded-lg">
            {getInitialsFallbackName(user!)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="min-w-56 space-y-1 rounded-lg"
        side="bottom"
        align="end"
        sideOffset={4}
      >
        <DropdownMenuItem
          className={cn(
            "p-0",
            user?.id && "bg-accent/50 border-l-primary border-l-2"
          )}
        >
          <div className="flex w-full items-center justify-between gap-2 px-1 py-1.5">
            <Avatar className="size-9 rounded-lg">
              {user?.avatar && (
                <AvatarImage src={user?.avatar || undefined} alt={user?.name} />
              )}
              <AvatarFallback className="rounded-lg">
                {getInitialsFallbackName(user!)}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{user?.name}</span>
              <span className="truncate text-xs capitalize">{user?.role}</span>
            </div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <BadgeCheck />
            Account
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CreditCard />
            Billing
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Bell />
            Notifications
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} disabled={isPending}>
          <LogOut />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

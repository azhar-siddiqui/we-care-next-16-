"use client";

import { LoggedInUser } from "@/types";
import { createContext, useContext } from "react";

const UserContext = createContext<LoggedInUser | null>(null);

export const useUser = () => {
  return useContext(UserContext);
};

export function UserProvider({
  children,
  user,
}: Readonly<{
  children: React.ReactNode;
  user: LoggedInUser | null;
}>) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

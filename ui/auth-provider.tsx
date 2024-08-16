"use client";

import { AuthKitProvider } from "@farcaster/auth-kit";
import { domain } from "@/lib/auth";
// import { SignIn } from "@/app/ui/auth/sign-in";
import { SessionProvider } from "next-auth/react";

const config = {
  relay: "https://relay.farcaster.xyz",
  rpcUrl: "https://mainnet.optimism.io",
  domain: domain,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthKitProvider config={config}>{children}</AuthKitProvider>
    </SessionProvider>
  );
}

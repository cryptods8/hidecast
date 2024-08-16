"use client";

import { SignInButton, StatusAPIResponse } from "@farcaster/auth-kit";
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
} from "@headlessui/react";
import {
  ArrowLeftStartOnRectangleIcon,
  ChevronDownIcon,
  ArrowPathIcon,
} from "@heroicons/react/16/solid";
import { Session } from "next-auth";
import { getCsrfToken, signIn, signOut, useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

function ProfileButton({
  session,
  onSignOut,
  isLoading,
}: {
  session?: Session;
  onSignOut: () => void;
  isLoading?: boolean;
}) {
  return (
    <div className="inline-flex flex-row text-white">
      <div
        className={`bg-primary-400 w-full px-4 py-2 text-lg font-bold bg-action-primary inline-flex items-center gap-2 transition duration-150 ease-in-out ${
          isLoading ? "rounded-lg" : "rounded-l-lg"
        }`}
      >
        {isLoading ? (
          <div className="size-8 animate-spin flex items-center justify-center">
            <ArrowPathIcon className="size-4" />
          </div>
        ) : session?.user?.image ? (
          <img src={session?.user.image} className="w-8 h-8 rounded-full" />
        ) : null}
      </div>
      {!isLoading && (
        <Menu>
          <MenuButton className="inline-flex items-center rounded-r-lg bg-action-primary py-3 px-3 data-[hover]:bg-action-primary/80 data-[open]:bg-action-primary/70 border-l border-black/10 transition duration-150 ease-in-out">
            <ChevronDownIcon className="size-6 fill-white/80" />
          </MenuButton>
          <Transition
            enter="transition ease-out duration-75"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <MenuItems
              anchor="bottom end"
              className="w-52 origin-top-right mt-1 rounded-lg text-white bg-action-primary font-bold [--anchor-gap:var(--spacing-1)] focus:outline-none shadow-lg"
            >
              <MenuItem>
                <button
                  className="group flex w-full items-center gap-2 rounded-lg py-3 px-5 bg-action-primary data-[focus]:bg-action-primary/80 transition duration-150 ease-in-out"
                  onClick={onSignOut}
                >
                  <ArrowLeftStartOnRectangleIcon className="size-5 fill-white/80" />
                  Sign out
                </button>
              </MenuItem>
            </MenuItems>
          </Transition>
        </Menu>
      )}
    </div>
  );
}

export function SignIn() {
  const { data: session, status } = useSession();

  const [error, setError] = useState(false);
  const [nonce, setNonce] = useState<string | null>(null);

  useEffect(() => {
    // somehow this is necessary to get the "good" nonce
    new Promise((res) => setTimeout(res, 150))
      .then(() => getCsrfToken())
      .then((nonce) => {
        if (!nonce) {
          throw new Error("Unable to generate nonce");
        }
        setNonce(nonce);
      });
  }, [session]);

  const handleSuccess = useCallback((res: StatusAPIResponse) => {
    signIn("credentials", {
      message: res.message,
      signature: res.signature,
      name: res.username,
      pfp: res.pfpUrl,
      redirect: false,
    })
      .then((x) => {
        if (x?.error || !x?.ok) {
          throw new Error("Error signing in: " + (x?.error || "unknown"));
        }
        window.location.reload();
      })
      .catch((e) => {
        console.error("Error signing in", e);
        signOut();
      });
  }, []);

  const handleSignOut = useCallback(() => {
    signOut();
  }, []);

  const isLoading = status === "loading" || !nonce;

  return (
    <div className="flex flex-row gap-2">
      {isLoading || session ? (
        <ProfileButton
          session={session ?? undefined}
          onSignOut={handleSignOut}
          isLoading={isLoading}
        />
      ) : (
        <SignInButton
          key={nonce}
          nonce={nonce!}
          onSuccess={handleSuccess}
          onError={() => {
            setError(true);
          }}
          onSignOut={() => signOut()}
        />
      )}
    </div>
  );
}

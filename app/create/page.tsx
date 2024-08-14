import { ComposerActionCast, UserKey } from "@/model/types";
import HideCastInput from "@/ui/hide-cast-input";
import { baseUrl } from "@/utils/constants";
import { verifySignedUrl } from "@/utils/signer";
import { NextServerPageProps } from "frames.js/next/types";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hidecast by ds8",
  description: "Hide your cast behind Reveal button",
};

export default function Home({ searchParams }: NextServerPageProps) {
  const currentUrl = new URL("/create", baseUrl);

  for (const [key, value] of Object.entries(searchParams || {})) {
    currentUrl.searchParams.set(key, value as string);
  }

  let verified = false;
  try {
    verifySignedUrl(currentUrl.toString());
    verified = true;
  } catch (e) {
    console.log("Invalid signed URL");
  }
  const stateParam = searchParams?.state as string | undefined;
  const cast = stateParam
    ? (JSON.parse(stateParam) as ComposerActionCast)
    : undefined;
  const uidParam = searchParams?.uid as string | undefined;
  const ipParam = searchParams?.ip as "fc" | "xmtp" | undefined;
  let userKey: UserKey | undefined;
  if (uidParam && ipParam) {
    userKey = { userId: uidParam, identityProvider: ipParam };
  }

  return (
    <main className="w-full">
      <div className="h-dvh w-full flex flex-col items-center">
        <div className="flex flex-col gap-4 max-w-full h-full p-8">
          <HideCastInput cast={cast} userKey={userKey} />
        </div>
      </div>
    </main>
  );
}

import HideCastInput from "@/ui/hide-cast-input";
import { AuthProvider } from "@/ui/auth-provider";
import { baseUrl } from "@/utils/constants";
import { fetchMetadata } from "frames.js/next";
import { NextServerPageProps } from "frames.js/next/types";
import { Metadata } from "next";
import { SignIn } from "@/ui/sign-in";
import { getServerSession } from "next-auth";

export async function generateMetadata({
  searchParams,
}: NextServerPageProps): Promise<Metadata> {
  const url = new URL("/frames", baseUrl);
  if (searchParams?.id) {
    url.searchParams.set("id", searchParams.id as string);
  }
  return {
    title: "Hidecast by ds8",
    other: await fetchMetadata(url),
  };
}

export default async function Home() {
  const session = await getServerSession();

  const fid = session?.user?.name;
  const userKey = fid
    ? { userId: fid, identityProvider: "fc" as const }
    : undefined;

  return (
    <AuthProvider>
      <main className="py-8 px-4 flex flex-col items-center w-full min-h-dvh">
        <div className="flex flex-col gap-4 max-w-sm">
          <div className="flex flex-row gap-3 items-start">
            <div className="flex-1">
              <h2 className="font-space font-bold text-2xl">Hidecast</h2>
              <span className="text-faint text-sm">
                Hide a message in a frame behind Reveal button
              </span>
            </div>
            <SignIn />
          </div>
          <HideCastInput userKey={userKey} />
        </div>
      </main>
    </AuthProvider>
  );
}

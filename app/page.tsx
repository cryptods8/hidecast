import HideCastInput from "@/ui/hide-cast-input";
import { baseUrl } from "@/utils/constants";
import { fetchMetadata } from "frames.js/next";
import { NextServerPageProps } from "frames.js/next/types";
import { Metadata } from "next";

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

export default function Home() {
  return (
    <main className="py-8 px-4 flex flex-col items-center w-full min-h-dvh">
      <div className="flex flex-col gap-4 max-w-sm">
        <h2 className="font-space font-bold text-2xl">Hide your cast</h2>
        <HideCastInput />
      </div>
    </main>
  );
}

import { findHiddenCastById } from "@/model/db/repo";
import { HiddenCastResponse as HideCastResponse } from "@/model/types";
import { baseUrl } from "@/utils/constants";
import { verifySignedUrl } from "@/utils/signer";
import { ImageResponse } from "@vercel/og";
import { NextRequest, NextResponse } from "next/server";
import { options } from "./options";
import { parseCastMessage } from "@/utils/hide-cast-utils";

export const dynamic = "force-dynamic";

function primaryColor(alpha?: number) {
  return `rgba(23, 16, 31, ${alpha ?? 0.87})`;
}

function Message({ shown, message }: { shown: boolean; message: string }) {
  const pm = parseCastMessage(message);
  const { parts } = pm;
  const redactedMessage = parts.reduce((acc, part) => {
    const text =
      part.isHidden && !shown ? part.text.replaceAll(/./g, "​_") : part.text;
    return acc + text;
  }, "");
  return (
    <div
      tw="w-full h-full flex items-center justify-center text-5xl bg-white"
      style={{ fontFamily: "Inter" }}
    >
      <div
        tw="w-full h-full flex relative items-center justify-center text-white"
        style={{ backgroundColor: primaryColor(1) }}
      >
        {!shown && (
          <div tw="flex absolute top-16">
            <div tw="text-4xl px-8 py-5 rounded-full border-2 border-white/20 bg-white/10 text-white/80 shadow-xl">
              Hidden message
            </div>
          </div>
        )}
        <div
          tw="flex p-16"
          style={{ lineHeight: "1.5", fontFamily: "SpaceGrotesk" }}
        >
          {redactedMessage}
        </div>
      </div>
    </div>
  );
}

function getRequestUrl(req: NextRequest, allowedQueryParams: string[]) {
  const url = new URL(req.url);
  // remove extra query params
  const urlParams = url.searchParams;
  for (let prop in urlParams) {
    if (
      urlParams.hasOwnProperty(prop) &&
      !allowedQueryParams.includes(prop) &&
      prop !== "signed"
    ) {
      urlParams.delete(prop);
    }
  }
  const search = urlParams.toString();
  return `${baseUrl}${url.pathname}${search ? `?${search}` : ""}`;
}

function verifyUrl(req: NextRequest, allowedQueryParams: string[]) {
  const url = getRequestUrl(req, allowedQueryParams);
  const verifiedUrl = verifySignedUrl(url);
  return new URL(verifiedUrl);
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const preview = searchParams.get("preview") === "true";
  const message = searchParams.get("msg");
  if (preview && message) {
    return new ImageResponse(
      <Message shown={false} message={message} />,
      options
    );
  }

  const reveal = searchParams.get("reveal") === "true";
  const id = searchParams.get("id");

  verifyUrl(req, ["id", "reveal"]);
  if (!id) {
    return NextResponse.json({ message: "No id provided" }, { status: 400 });
  }
  const spoiler = await findHiddenCastById(id);
  if (!spoiler) {
    return NextResponse.json({ message: "Spoiler not found" }, { status: 404 });
  }
  return new ImageResponse(
    <Message shown={reveal} message={spoiler.message} />,
    options
  );
}

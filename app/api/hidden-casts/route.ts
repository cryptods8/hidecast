import { findHiddenCastById, saveHiddenCast } from "@/model/db/repo";
import { HiddenCastRequest } from "@/model/types";
import { MAX_CHAR, trimMessage } from "@/utils/hide-cast-utils";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const payload = (await req.json()) as HiddenCastRequest;

  const hiddenCast = await saveHiddenCast({
    ...payload,
    message: trimMessage(payload.message, MAX_CHAR),
  });

  return NextResponse.json(hiddenCast, { status: 201 });
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ message: "No id provided" }, { status: 400 });
  }

  const hiddenCast = await findHiddenCastById(id);

  return NextResponse.json(hiddenCast, { status: 200 });
}

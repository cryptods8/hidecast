import { composerAction, composerActionForm, error } from "frames.js/core";
import { externalBaseUrl } from "@/utils/constants";
import { createCustomFrames } from "../frames/frames";

export const GET = async () => {
  return composerAction({
    action: {
      type: "post",
    },
    icon: "eye-closed",
    name: "Hidecast",
    aboutUrl: `${externalBaseUrl}`,
    description: "Hide cast in frame",
    // @ts-ignore
    imageUrl: `${externalBaseUrl}/logo.png`,
  });
};

export const POST = createCustomFrames({ basePath: "/action" })(async (ctx) => {
  console.log("ctx", ctx);
  const { userKey } = ctx;
  if (!userKey) {
    return error("Must be authenticated");
  }

  if (!ctx.composerActionState) {
    return error("Must be called from composer");
  }

  const url = ctx.createSignedUrl({
    pathname: "/create",
    query: {
      uid: userKey.userId,
      ip: userKey.identityProvider,
      state: JSON.stringify(ctx.composerActionState),
    },
  });

  return composerActionForm({
    title: "Hide a cast",
    url,
  });
});

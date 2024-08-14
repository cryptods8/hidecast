import { UserKey } from "@/model/types";
import {
  baseUrl,
  externalBaseUrl,
  hubHttpUrl,
  hubRequestOptions,
} from "@/utils/constants";
import { signUrl } from "@/utils/signer";
import { validateFrameMessage } from "frames.js";
import { warpcastComposerActionState } from "frames.js/middleware";
import { createFrames } from "frames.js/next";
import { FramesMiddleware } from "frames.js/types";

interface FrameValidationResult {
  isValid: boolean;
}

type CreateUrlFunctionArgs =
  | string
  | { pathname?: string; query?: Record<string, string | undefined> };
type CreateUrlFunction = (arg: CreateUrlFunctionArgs) => string;

const userKeyMiddleware: FramesMiddleware<any, { userKey?: UserKey }> = async (
  ctx,
  next
) => {
  const { clientProtocol, message, validationResult } = ctx as any;
  if (
    !clientProtocol ||
    !message ||
    (validationResult && !validationResult.isValid)
  ) {
    return next();
  }
  switch (clientProtocol.id) {
    case "xmtp":
      return next({
        userKey: {
          identityProvider: "xmtp",
          userId: message.verifiedWalletAddress!,
        },
      });
    case "farcaster":
      return next({
        userKey: {
          identityProvider: "fc",
          userId: message.requesterFid!.toString(),
        },
      });
    default:
      console.warn("invalid clientProtocol id", clientProtocol.id);
  }
  return next();
};

const urlBuilderMiddleware: FramesMiddleware<
  any,
  {
    createUrl: CreateUrlFunction;
    createUrlWithBasePath: CreateUrlFunction;
    createSignedUrl: CreateUrlFunction;
    createSignedUrlWithBasePath: CreateUrlFunction;
    createExternalUrl: CreateUrlFunction;
  }
> = async (ctx, next) => {
  const provideCreateUrl = (withBasePath: boolean, customBaseUrl?: string) => {
    const bUrl = customBaseUrl ?? baseUrl;
    return (arg: CreateUrlFunctionArgs) => {
      if (typeof arg === "string") {
        const pathname = withBasePath ? `${ctx.basePath}${arg}` : arg;
        return `${bUrl}${pathname}`;
      }
      const { pathname, query } = arg;
      const fullPathname = withBasePath
        ? `${ctx.basePath}${pathname ?? ""}`
        : pathname;
      const url = new URL(fullPathname ?? "", bUrl);
      if (query) {
        for (const [key, value] of Object.entries(query)) {
          if (value != null) {
            url.searchParams.set(key, value);
          }
        }
      }
      return url.toString();
    };
  };
  return next({
    createUrl: provideCreateUrl(false),
    createUrlWithBasePath: provideCreateUrl(true),
    createSignedUrl: (arg: CreateUrlFunctionArgs) => {
      const url = provideCreateUrl(false)(arg);
      return signUrl(url);
    },
    createSignedUrlWithBasePath: (arg: CreateUrlFunctionArgs) => {
      const url = provideCreateUrl(true)(arg);
      return signUrl(url);
    },
    createExternalUrl: provideCreateUrl(false, externalBaseUrl),
  });
};

const validationMiddleware: FramesMiddleware<
  any,
  { validationResult?: FrameValidationResult }
> = async (ctx, next) => {
  const { request } = ctx;
  if (request.method !== "POST") {
    return next();
  }

  let payload;
  try {
    payload = await request.clone().json();
  } catch (e) {
    return next();
  }

  // ignore message
  const { message, ...validationResult } = await validateFrameMessage(payload, {
    hubHttpUrl,
    hubRequestOptions,
  });

  return next({ validationResult });
};

export const createCustomFrames = (options: { basePath: string }) =>
  createFrames({
    basePath: options.basePath,
    middleware: [
      userKeyMiddleware,
      urlBuilderMiddleware,
      validationMiddleware,
      warpcastComposerActionState(),
    ],
  });

export const frames = createCustomFrames({
  basePath: "/frames",
});

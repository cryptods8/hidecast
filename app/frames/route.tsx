/* eslint-disable react/jsx-key */
import { Button } from "frames.js/next";
import { frames } from "./frames";
import { error } from "frames.js/core";
import { findHiddenCastById } from "@/model/db/repo";
import { HiddenCastResponse, UserKey } from "@/model/types";
import { hubHttpUrl, hubRequestOptions } from "@/utils/constants";
import { checkMoxieFanTokensRequirement } from "./check-moxie-fan-tokens-requirement";

async function safeFetch(url: string, options?: RequestInit) {
  try {
    return await fetch(url, options);
  } catch (e) {
    return { ok: false };
  }
}

async function checkRequirements(
  cast: HiddenCastResponse,
  castId: { fid: number; hash: `0x${string}` } | undefined,
  makerUserKey: UserKey | null,
  requesterUserKey: UserKey
) {
  const promises = [];
  const types: string[] = [];
  const fid = makerUserKey?.userId
    ? parseInt(makerUserKey.userId)
    : castId?.fid;
  if (fid && fid !== castId?.fid) {
    return { ok: false, message: "This message has been stolen!" };
  }
  if (fid && fid === parseInt(requesterUserKey.userId, 10)) {
    // if the maker is the requester, all requirements are met
    return { ok: true };
  }
  if (cast.moxieFanTokensRequired && fid != null) {
    const minTokens = cast.minMoxieFanTokens ?? 0;
    const ok = await checkMoxieFanTokensRequirement(
      fid,
      parseInt(requesterUserKey.userId, 10),
      minTokens
    );
    if (!ok) {
      const message =
        minTokens > 0
          ? `You need at least ${minTokens} Moxie Fan Tokens to view the content.`
          : "You need Moxie Fan Tokens to view the content.";
      return {
        ok: false,
        message,
      };
    }
  }
  if (cast.followRequired) {
    // follow
    promises.push(
      safeFetch(
        `${hubHttpUrl}/v1/linkById?fid=${requesterUserKey.userId}&target_fid=${fid}&link_type=follow`,
        hubRequestOptions
      ).then((res) => res.ok || requesterUserKey.userId === fid?.toString())
    );
    types.push("follow caster");
  }
  if (cast.likeRequired) {
    // like
    promises.push(
      safeFetch(
        `${hubHttpUrl}/v1/reactionById?fid=${requesterUserKey.userId}&reaction_type=1&target_fid=${castId?.fid}&target_hash=${castId?.hash}`,
        hubRequestOptions
      ).then((res) => res.ok)
    );
    types.push("like");
  }
  if (cast.recastRequired) {
    promises.push(
      safeFetch(
        `${hubHttpUrl}/v1/reactionById?fid=${requesterUserKey.userId}&reaction_type=2&target_fid=${castId?.fid}&target_hash=${castId?.hash}`,
        hubRequestOptions
      ).then((res) => res.ok)
    );
    types.push("recast");
  }
  const res = await Promise.all(promises);
  const failedTypes = res.reduce((acc, ok, idx) => {
    if (!ok) {
      acc.push(types[idx]);
    }
    return acc;
  }, [] as string[]);
  if (failedTypes.length > 0) {
    // construct the message from types such as the first letter of first word is capitalized, the rest is lowercase and separated by commas except for the last one, which is separated by "and"
    const message =
      failedTypes
        .map((type, idx) =>
          idx === 0
            ? type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()
            : idx === failedTypes.length - 1
            ? ` and ${type.toLowerCase()}`
            : `, ${type.toLowerCase()}`
        )
        .join("") + " to view the content!";
    return { ok: false, message };
  }
  return { ok: true };
}

const handleRequest = frames(async (ctx) => {
  const { searchParams, userKey, message } = ctx;

  const reveal = searchParams.reveal === "true" && userKey;
  const id = searchParams.id;
  if (!id) {
    return error("No id provided!");
  }
  const hiddenCast = await findHiddenCastById(id);
  if (!hiddenCast) {
    return error("Cast not found!");
  }

  const requirements = reveal
    ? await checkRequirements(
        hiddenCast,
        message?.castId,
        hiddenCast.userKey,
        userKey
      )
    : null;
  if (requirements && !requirements.ok) {
    return error(requirements.message || "Requirements not met!");
  }

  console.log("hiddenCast", hiddenCast);
  let hiddenUrl = hiddenCast.url && reveal ? hiddenCast.url : undefined;
  if (hiddenUrl && userKey) {
    try {
      const urlObj = new URL(hiddenUrl);
      urlObj.searchParams.set("hc_fid", userKey?.userId ?? "");
      hiddenUrl = urlObj.toString();
    } catch (e) {
      console.error("Failed to parse hiddenUrl", e);
      hiddenUrl = undefined;
    }
  }

  return {
    image: ctx.createSignedUrl({
      pathname: "/frames/image",
      query: { id, reveal: reveal ? "true" : "false" },
    }),
    buttons: [
      <Button
        action="post"
        target={ctx.createUrlWithBasePath({
          query: { reveal: reveal ? "false" : "true", id },
        })}
      >
        {reveal ? "Hide" : "Reveal"}
      </Button>,
      hiddenCast.userKey && hiddenCast.moxieFanTokensRequired ? (
        <Button
          action="post"
          target={`https://moxie-frames.airstack.xyz/stim?t=fid_${hiddenCast.userKey?.userId}&__bi=2-p`}
        >
          Fan Tokens
        </Button>
      ) : null,
      hiddenUrl ? (
        <Button action="link" target={hiddenUrl}>
          Go
        </Button>
      ) : (
        <Button action="link" target={ctx.createExternalUrl("/")}>
          Make my own
        </Button>
      ),
    ],
  };
});

export const GET = handleRequest;
export const POST = handleRequest;

/* eslint-disable react/jsx-key */
import { Button } from "frames.js/next";
import { frames } from "./frames";
import { error } from "frames.js/core";
import { findHiddenCastById } from "@/model/db/repo";
import { HiddenCastResponse, UserKey } from "@/model/types";
import { hubHttpUrl, hubRequestOptions } from "@/utils/constants";

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
  userKey: UserKey
) {
  const promises = [];
  const types: string[] = [];
  if (cast.followRequired) {
    // follow
    if (userKey.userId === castId?.fid?.toString()) {
      promises.push(Promise.resolve(true));
    } else {
      promises.push(
        safeFetch(
          `${hubHttpUrl}/v1/linkById?fid=${userKey.userId}&target_fid=${castId?.fid}&link_type=follow`,
          hubRequestOptions
        ).then((res) => res.ok || userKey.userId === castId?.fid?.toString())
      );
    }
    types.push("follow caster");
  }
  if (cast.likeRequired) {
    // like
    promises.push(
      safeFetch(
        `${hubHttpUrl}/v1/reactionById?fid=${userKey.userId}&reaction_type=1&target_fid=${castId?.fid}&target_hash=${castId?.hash}`,
        hubRequestOptions
      ).then((res) => res.ok)
    );
    types.push("like");
  }
  if (cast.recastRequired) {
    promises.push(
      safeFetch(
        `${hubHttpUrl}/v1/reactionById?fid=${userKey.userId}&reaction_type=2&target_fid=${castId?.fid}&target_hash=${castId?.hash}`,
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
        { ...hiddenCast, recastRequired: true },
        message?.castId,
        userKey
      )
    : // TODO
      // ? await checkRequirements(hiddenCast, message?.castId, userKey)
      null;
  if (requirements && !requirements.ok) {
    return error(requirements.message || "Requirements not met!");
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
    ],
  };
});

export const GET = handleRequest;
export const POST = handleRequest;

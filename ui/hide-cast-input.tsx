"use client";

import {
  ComposerActionCast,
  HiddenCastRequest,
  HiddenCastResponse,
  UserKey,
} from "@/model/types";
import { parseCastMessage, HIDE_CAST_INDICATOR } from "@/utils/hide-cast-utils";
import { ChangeEvent, MouseEvent, useEffect, useState } from "react";

const MAX_CHAR = 140;

const saveCast = async (
  request: HiddenCastRequest
): Promise<HiddenCastResponse | null> => {
  try {
    const res = await fetch("/api/hidden-casts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });
    if (!res.ok) {
      console.error("Error saving hidden cast:", res.statusText);
      return null;
    }
    const data = await res.json();
    return data;
  } catch (e) {
    console.error("Error", e);
    return null;
  }
};

const generateUrl = (id: string) => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/?id=${id}`;
};

function ToastMessage({ toast }: { toast: ToastData | null }) {
  const { message, type } = toast || {};
  const [shown, setShown] = useState(!!message);
  useEffect(() => {
    setShown(true);
    const timer = setTimeout(() => {
      setShown(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [setShown, toast]);
  return (
    <div className="fixed bottom-4 max-w-sm">
      {shown && message && (
        <div
          className={`w-full text-white px-5 py-3 text-sm rounded-lg shadow ${
            type === "error" ? "bg-red-900/90" : "bg-primary-900/80"
          }`}
          role="alert"
        >
          {message}
        </div>
      )}
    </div>
  );
}

interface ToastData {
  message: string;
  type?: "error" | "info";
}

function isValidUrl(url: string) {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

export default function HideCastInput({
  cast,
  userKey,
}: {
  cast?: ComposerActionCast;
  userKey?: UserKey;
}) {
  const [val, setVal] = useState(cast?.text || "");
  const [url, setUrl] = useState(cast?.embeds[0] || "");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [id, setId] = useState("");
  const [toast, setToast] = useState<ToastData | null>(null);

  const [likeRequired, setLikeRequired] = useState(false);
  const [recastRequired, setRecastRequired] = useState(false);
  const [followRequired, setFollowRequired] = useState(false);
  const [moxieFanTokensRequired, setMoxieFanTokensRequired] = useState(false);
  const [minMoxieFanTokens, setMinMoxieFanTokens] = useState(0);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [password, setPassword] = useState("");

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    setVal(v);
  };

  const handleUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setUrl(v?.trim());
  };

  const handleClear = () => {
    setSubmitted(false);
    setSubmitting(false);
    setVal("");
    setId("");

    setLikeRequired(false);
    setRecastRequired(false);
    setFollowRequired(false);
  };

  const handleSubmit = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // const res = { id: Math.random().toString(36).substr(2) };
      const res = await saveCast({
        message: val,
        userKey: userKey ?? null,
        likeRequired,
        recastRequired,
        followRequired,
        moxieFanTokensRequired,
        minMoxieFanTokens,
        url,
        passwordRequired,
        password,
      });
      if (res !== null) {
        setId(res.id);

        if (cast) {
          const newFrameUrl = generateUrl(res.id);
          window.parent.postMessage(
            {
              type: "createCast",
              data: {
                cast: {
                  ...cast,
                  text: "",
                  // always append to the end of the embeds array
                  embeds: [...cast.embeds, newFrameUrl.toString()],
                },
              },
            },
            "*"
          );
        } else {
          const url = generateUrl(res.id);
          if (typeof navigator !== "undefined" && navigator.share) {
            navigator.share({
              title: "Hidecast by @ds8",
              url,
            });
          } else {
            navigator.clipboard.writeText(url);
            setToast({ message: "Link copied to your clipboard." });
          }
          setSubmitted(true);
        }
      } else {
        setToast({ message: "Error saving cast!", type: "error" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const castMessage = parseCastMessage(val);
  const validUrl = url && isValidUrl(url);

  return (
    <form className="h-full">
      <div className="flex flex-col h-full gap-8 text-sm">
        <div className="flex flex-col gap-6">
          {/* <div>
            <h2 className="font-space font-bold text-2xl">Hidecast</h2>
            <span className="text-faint text-sm">
              Hide a message in a frame behind Reveal button
            </span>
          </div> */}

          <div className="flex flex-col gap-2">
            {/* <label htmlFor="message" className="font-semibold">
              Cast message
            </label> */}
            <textarea
              id="message"
              value={val}
              onChange={handleChange}
              placeholder="Type your message"
              rows={5}
              autoFocus
              className="border border-default rounded p-2 bg-transparent w-full"
            />
            <div className="flex flex-row gap-3 text-xs text-faint">
              <div>
                <span className="leading-normal">
                  To hide your entire message, just type and hit{" "}
                  {cast ? "Confirm" : "Share"}. To conceal only a part, wrap it
                  in{" "}
                  <code className="bg-primary-900/10 px-1 pt-1 rounded">
                    {HIDE_CAST_INDICATOR}
                  </code>{" "}
                  – like &apos;Guess who? {HIDE_CAST_INDICATOR}Clark Kent
                  {HIDE_CAST_INDICATOR} is Superman!&apos; for a partially
                  hidden cast.
                </span>
              </div>
              <div className="w-40 text-right">
                <span
                  className={
                    castMessage.length > MAX_CHAR ? "text-red-500" : ""
                  }
                >
                  {castMessage.length} / {MAX_CHAR}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="url" className="font-semibold">
              URL
            </label>
            <input
              type="url"
              id="url"
              value={url}
              onChange={handleUrlChange}
              className="border border-default rounded p-2 bg-transparent w-full"
            />
            <div className="text-xs text-faint">
              You can optionally provide a URL that will be shown to the user on
              successful reveal
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="font-semibold">Gate access to your message</span>
            <label className="flex gap-2 items-center">
              <input
                className="size-6 accent-action-primary"
                type="checkbox"
                checked={likeRequired}
                onChange={(e) => setLikeRequired(e.target.checked)}
              />
              Like required
            </label>
            <label className="flex gap-2 items-center">
              <input
                className="size-6 accent-action-primary"
                type="checkbox"
                checked={recastRequired}
                onChange={(e) => setRecastRequired(e.target.checked)}
              />
              Recast required
            </label>
            <label className="flex gap-2 items-center">
              <input
                className="size-6 accent-action-primary"
                type="checkbox"
                checked={followRequired}
                onChange={(e) => setFollowRequired(e.target.checked)}
              />
              Follow required
            </label>
            <label
              className={`flex gap-2 items-center ${
                userKey ? "" : "text-faint"
              }`}
            >
              <input
                className="size-6 accent-action-primary"
                type="checkbox"
                checked={moxieFanTokensRequired}
                onChange={(e) => setMoxieFanTokensRequired(e.target.checked)}
                disabled={!userKey}
              />
              Moxie Fan Tokens required
            </label>
            {!userKey && (
              <span className="pl-8 text-faint text-xs">
                Sign In to gate your message by Moxie Fan Tokens
              </span>
            )}
            {moxieFanTokensRequired && (
              <div className="flex flex-row gap-3 items-center pl-8">
                <label htmlFor="minMoxieFanTokens">Minimum required</label>
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  id="minMoxieFanTokens"
                  value={minMoxieFanTokens}
                  onChange={(e) =>
                    setMinMoxieFanTokens(parseFloat(e.target.value))
                  }
                  className="border border-default rounded p-2 bg-transparent w-24"
                />
              </div>
            )}
            <label className="flex gap-2 items-center">
              <input
                className="size-6 accent-action-primary"
                type="checkbox"
                checked={passwordRequired}
                onChange={(e) => setPasswordRequired(e.target.checked)}
              />
              Password required
            </label>
            {passwordRequired && (
              <div className="flex w-full gap-2 pl-8">
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border border-default rounded p-2 bg-transparent w-full"
                  placeholder="Enter password"
                />
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-3 w-full items-center justify-end">
          <button
            className="w-full rounded-lg font-semibold border border-transparent bg-action-primary text-white active:border-action-primary-active disabled:bg-action-primary-disabled disabled:text-action-primary-disabled disabled:active:border-transparent px-[0.9333rem] py-[0.4333rem] text-sm"
            disabled={
              submitting || castMessage.length > MAX_CHAR || val.length === 0
            }
            onClick={handleSubmit}
            type="submit"
          >
            {submitting ? "Submitting..." : cast ? "Create" : "Share"}
          </button>
          {submitted && (
            <button
              className="w-full rounded-lg font-semibold border bg-action-tertiary border-action-tertiary hover:bg-action-tertiary-hover hover:border-action-tertiary-hover active:border-action-tertiary-active disabled:border-action-tertiary disabled:text-action-tertiary-disabled disabled:hover:bg-action-tertiary disabled:active:border-action-tertiary px-4 py-2 text-sm grid !rounded-lg text-default"
              onClick={handleClear}
            >
              Start again
            </button>
          )}
          {submitted && (
            <div className="w-full">
              <div className="text-xs text-faint">
                Hidden message submitted to:
              </div>
              <a className="underline hover:opacity-80" href={generateUrl(id)}>
                {generateUrl(id)}
              </a>
            </div>
          )}
          <ToastMessage toast={toast} />
        </div>
      </div>
    </form>
  );
}

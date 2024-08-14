export interface UserKey {
  identityProvider: "fc" | "xmtp";
  userId: string;
}

export type HiddenCastRequest = {
  message: string;
  likeRequired: boolean | null | undefined;
  recastRequired: boolean | null | undefined;
  followRequired: boolean | null | undefined;
  userKey: UserKey | null;
};

export type HiddenCastResponse = HiddenCastRequest & {
  id: string;
};

export type ComposerActionCast = {
  parent?: string;
  text: string;
  embeds: string[];
};

export type ComposerActionMessage = {
  type: "createCast";
  data: {
    cast: ComposerActionCast;
  };
};

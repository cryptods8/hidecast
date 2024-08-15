import { MessagePropsColumn } from "./db/types";

export interface UserKey {
  identityProvider: "fc" | "xmtp";
  userId: string;
}

export type HiddenCastRequest = MessagePropsColumn & {
  message: string;
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

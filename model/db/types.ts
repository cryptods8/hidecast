import {
  ColumnType,
  Generated,
  Insertable,
  JSONColumnType,
  Selectable,
  Updateable,
} from "kysely";
import { UserKey } from "../types";

export interface Database {
  hiddenCast: HiddenCastTable;
}

export interface MessagePropsColumn {
  likeRequired: boolean | null | undefined;
  recastRequired: boolean | null | undefined;
  followRequired: boolean | null | undefined;
  moxieFanTokensRequired: boolean | null | undefined;
  minMoxieFanTokens: number | null | undefined;
  url: string | null | undefined;
  passwordRequired: boolean | null | undefined;
  password: string | null | undefined;
}

type MessagePropsColumnType = JSONColumnType<MessagePropsColumn>;

export interface HiddenCastTable {
  id: string;
  message: string;
  messageProps: MessagePropsColumnType;
  userKey: JSONColumnType<UserKey> | null;

  createdAt: Date;
  updatedAt: Date;
}

export type DBHiddenCast = Selectable<HiddenCastTable>;
export type DBHiddenCastInsert = Insertable<HiddenCastTable>;
export type DBHiddenCastUpdate = Updateable<HiddenCastTable>;

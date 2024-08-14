import { HiddenCastRequest, HiddenCastResponse } from "../types";
import { pgDb } from "./pg-db";
import { v4 as uuid } from "uuid";

export async function saveHiddenCast(
  cast: HiddenCastRequest
): Promise<HiddenCastResponse> {
  const id = uuid();
  const messageProps = {
    likeRequired: cast.likeRequired,
    recastRequired: cast.recastRequired,
    followRequired: cast.followRequired,
  };
  await pgDb
    .insertInto("hiddenCast")
    .values({
      id,
      message: cast.message,
      messageProps: JSON.stringify(messageProps),
      createdAt: new Date(),
      updatedAt: new Date(),
      userKey: cast.userKey ? JSON.stringify(cast.userKey) : null,
    })
    .execute();
  return { id, ...cast };
}

export async function findHiddenCastById(
  id: string
): Promise<HiddenCastResponse | null> {
  const result = await pgDb
    .selectFrom("hiddenCast")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirst();
  if (!result) {
    return null;
  }
  const { message, messageProps, userKey } = result;
  return { id, message, userKey, ...messageProps };
}

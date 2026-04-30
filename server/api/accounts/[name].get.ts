import type { Account } from "../../../app/types/account";
import { floatingFetch } from "../../utils/floating-api";
import { readSession } from "../../utils/session";

export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, "name");
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: "Missing account name" });
  }

  const session = await readSession(event);
  const token = session?.accessToken;

  return floatingFetch<Account>(
    event,
    `/passport/accounts/${encodeURIComponent(name)}`,
    { token },
  );
});

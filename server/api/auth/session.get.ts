import { readSessionWithUser } from "../../utils/session";

export default defineEventHandler(async (event) => {
  const session = await readSessionWithUser(event);
  return {
    authenticated: Boolean(session),
    user: session?.user ?? null,
  };
});

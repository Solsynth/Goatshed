import { auth } from "~~/server/utils/auth";
import { toWebRequest } from "h3";

export default defineEventHandler((event) => {
  const request = toWebRequest(event);
  return auth.handler(request);
});

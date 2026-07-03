import { useUserStore } from "~/stores/user";

export default defineNuxtPlugin(async () => {
  const store = useUserStore();

  if (import.meta.server) {
    const event = useRequestEvent()!;
    store.setSession(event.context.session);
  }
});

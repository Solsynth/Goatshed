import { createAuthClient } from "better-auth/vue";

export function useAuth() {
  const url = useRequestURL();
  const headers = import.meta.server ? useRequestHeaders(["cookie"]) : undefined;
  const client = createAuthClient({
    baseURL: url.origin,
    fetchOptions: { headers },
  });

  const sessionState = client.useSession();
  const session = computed(() => sessionState.value?.data ?? null);
  const user = computed(() => sessionState.value?.data?.user ?? null);
  const authenticated = computed(() => Boolean(sessionState.value?.data));

  function login(next = "/me") {
    return navigateTo(`/login?next=${encodeURIComponent(next)}`);
  }

  async function logout() {
    await client.signOut();
  }

  return {
    client,
    session,
    user,
    authenticated,
    login,
    logout,
    useSession: client.useSession,
    signIn: client.signIn,
    signOut: client.signOut,
  };
}

export function useServerSession() {
  if (!import.meta.server) {
    throw new Error("useServerSession can only be used on the server");
  }
  const event = useRequestEvent()!;
  return event.context.session || null;
}

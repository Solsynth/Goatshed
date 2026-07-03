export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) {
    const session = await useServerSession();
    if (!session) {
      return navigateTo({ path: "/login", query: { next: to.fullPath } });
    }
  } else {
    const { data: session } = await useAuth().useSession(useFetch);
    if (!session.value) {
      return navigateTo({ path: "/login", query: { next: to.fullPath } });
    }
  }
});

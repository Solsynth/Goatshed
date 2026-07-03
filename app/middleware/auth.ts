export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) {
    const session = await useServerSession();
    if (!session) {
      return navigateTo({ path: "/login", query: { next: to.fullPath } });
    }
  }
});

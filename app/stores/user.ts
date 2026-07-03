import { defineStore } from "pinia";

export interface SolarUserProfile {
  name?: string;
  nick?: string;
  profile?: {
    bio?: string;
    nick?: string;
    verification?: { title?: string };
    background?: { id?: string; url?: string };
    location?: string;
    timeZone?: string;
    email?: string;
  };
  language?: string;
  region?: string;
  updatedAt?: string;
}

export const useUserStore = defineStore("user", () => {
  const solarsession = ref<any>(null);
  const solarProfile = ref<SolarUserProfile | null>(null);
  const isProfileLoading = ref(false);
  const isSessionLoading = ref(true);

  const session = computed(() => solarsession.value);

  async function fetchProfile(force = false) {
    if (!solarsession.value) return;
    if (isProfileLoading.value) return;
    isProfileLoading.value = true;
    try {
      const path = force ? "/api/sn/refresh" : "/api/sn/profile";
      const method = force ? "post" : "get";
      const data = await $fetch<SolarUserProfile>(path, {
        method,
        headers: import.meta.server ? useRequestHeaders(["cookie"]) : undefined,
      });
      if (data) {
        solarProfile.value = { ...data, updatedAt: new Date().toISOString() };
      }
    } catch {
      // keep stale profile
    } finally {
      isProfileLoading.value = false;
    }
  }

  function setSession(val: any) {
    solarsession.value = val;
    isSessionLoading.value = false;
  }

  function $reset() {
    solarsession.value = null;
    solarProfile.value = null;
    isProfileLoading.value = false;
    isSessionLoading.value = true;
  }

  return {
    solarsession,
    session,
    solarProfile,
    isProfileLoading,
    isSessionLoading,
    fetchProfile,
    setSession,
    $reset,
  };
});

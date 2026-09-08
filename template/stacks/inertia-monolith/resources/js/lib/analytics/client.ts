type AnalyticsConfig = { enabled: boolean; key: string; host: string };
type Client = {
  init(
    key: string,
    options: {
      api_host: string;
      autocapture: false;
      capture_pageview: false;
      capture_pageleave: false;
      disable_session_recording: true;
      person_profiles: "never";
      property_denylist: string[];
    },
  ): unknown;
  capture(event: string): unknown;
};

export function createAnalytics(
  config: AnalyticsConfig,
  load: () => Promise<Client> = async () => (await import("posthog-js")).default,
) {
  let client: Promise<Client> | undefined;
  return {
    async capture(event: string): Promise<void> {
      if (!config.enabled || !config.key || !config.host) return;
      try {
        client ??= load().then((sdk) => {
          sdk.init(config.key, {
            api_host: config.host,
            autocapture: false,
            capture_pageview: false,
            capture_pageleave: false,
            disable_session_recording: true,
            person_profiles: "never",
            property_denylist: [
              "$current_url",
              "$pathname",
              "$referrer",
              "$initial_current_url",
              "$initial_pathname",
              "$initial_referrer",
            ],
          });
          return sdk;
        });
        (await client).capture(event);
      } catch {
        client = undefined;
      }
    },
  };
}

export const analytics = createAnalytics({
  enabled: import.meta.env.VITE_POSTHOG_ENABLED === "true",
  key: import.meta.env.VITE_POSTHOG_KEY ?? "",
  host: import.meta.env.VITE_POSTHOG_HOST ?? "",
});

import { describe, expect, test, vi } from "vitest";
import { analytics, createAnalytics } from "./client";

vi.mock("posthog-js", () => ({ default: { init: vi.fn(), capture: vi.fn() } }));

describe("PostHog activation", () => {
  test.each([
    { enabled: false, key: "public-key", host: "https://eu.i.posthog.com" },
    { enabled: true, key: "", host: "https://eu.i.posthog.com" },
  ])("disabled or unconfigured produces no initialization or traffic", async (config) => {
    const load = vi.fn();
    await createAnalytics(config, load).capture("test");
    expect(load).not.toHaveBeenCalled();
  });
  test("explicit enablement initializes once and avoids automatic collection", async () => {
    const client = { init: vi.fn(), capture: vi.fn() };
    const load = vi.fn(async () => client);
    const analytics = createAnalytics(
      { enabled: true, key: "public-key", host: "https://eu.i.posthog.com" },
      load,
    );
    await Promise.all([analytics.capture("first"), analytics.capture("second")]);
    expect(load).toHaveBeenCalledTimes(1);
    expect(client.init).toHaveBeenCalledWith(
      "public-key",
      expect.objectContaining({
        autocapture: false,
        capture_pageview: false,
        disable_session_recording: true,
        person_profiles: "never",
        property_denylist: expect.arrayContaining(["$current_url", "$pathname", "$referrer"]),
      }),
    );
    expect(client.capture).toHaveBeenCalledTimes(2);
  });
  test("the default entry point stays inert and the lazy SDK can be explicitly activated", async () => {
    await analytics.capture("disabled");
    const { default: sdk } = await import("posthog-js");
    expect(sdk.init).not.toHaveBeenCalled();
    await createAnalytics({
      enabled: true,
      key: "public-key",
      host: "https://eu.i.posthog.com",
    }).capture("enabled");
    expect(sdk.init).toHaveBeenCalledOnce();
  });
  test("SDK loading failures do not break the product and a later event retries", async () => {
    const load = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue({ init: vi.fn(), capture: vi.fn() });
    const client = createAnalytics(
      { enabled: true, key: "public-key", host: "https://eu.i.posthog.com" },
      load,
    );
    await client.capture("offline");
    await client.capture("online");
    expect(load).toHaveBeenCalledTimes(2);
  });
});

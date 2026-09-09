import type { Page } from "@playwright/test";

export const account = {
  name: "Alex Lee",
  email: "alex@example.test",
  verified: true,
  authenticatorPending: false,
  authenticatorConfirmed: false,
  passkeyCount: 0,
};

/** Reuse the installed app's built entry point; stub only server page props. */
export async function accountPage(
  page: Page,
  path: string,
  component: string,
  props: Record<string, unknown> = {},
) {
  const response = await page.request.get("/login");
  const html = await response.text();
  const data = JSON.stringify({
    component,
    props: {
      account,
      capabilities: { registrationEnabled: false, registrationUrl: null },
      errors: {},
      ...props,
    },
    url: path,
    version: "",
    clearHistory: false,
    encryptHistory: false,
  }).replaceAll("<", "\\u003c");
  const document = html.replace(
    /(<script data-page="app" type="application\/json">)[\s\S]*?(<\/script>)/,
    `$1${data}$2`,
  );
  if (document === html)
    throw new Error("The installed Inertia document did not include page data.");
  await page.route(`**${path}`, async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    if (route.request().headers()["x-inertia"])
      return route.fulfill({ json: JSON.parse(data), headers: { "X-Inertia": "true" } });
    return route.fulfill({ contentType: "text/html", body: document });
  });
  await page.goto(path);
}

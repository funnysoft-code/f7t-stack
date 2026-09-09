// Run with dev-browser --connect http://127.0.0.1:9240.
// The named page must already be signed in to the assigned local fixture.
const page = await browser.getPage("u10-live");
const routes = [
  ["home", "/"],
  ["profile", "/settings/profile"],
  ["security", "/settings/security"],
  ["passkeys", "/settings/passkeys"],
  ["authenticator", "/settings/authenticator"],
  ["recovery", "/settings/recovery"],
  ["deletion", "/settings/delete"],
  ["confirmation", "/user/confirm-password"],
];
const results = [];
for (const [name, path] of routes) {
  await page.goto(`http://localhost:8041${path}`, { waitUntil: "domcontentloaded" });
  await page.locator("h1").waitFor();
  await page.evaluate(() => document.fonts.ready);
  for (const [suffix, width, height] of [
    ["", 1440, 900],
    ["-mobile", 390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    const screenshot = await saveScreenshot(await page.screenshot(), `u10-${name}${suffix}.png`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    results.push({ name, width, height, screenshot, overflow });
  }
}
console.log(JSON.stringify(results));

// Run with dev-browser --browser f7t-design --headless --timeout 60 run <this-file>.
const page = await browser.getPage("account");
const results = [];
for (const direction of ["a", "b"]) {
  await page.setViewportSize({ width: 390, height: 844 });
  const goto = async (screen) =>
    await page.goto(`http://127.0.0.1:4187/index-${direction}.html?screen=${screen}`, {
      waitUntil: "load",
    });
  await goto("login");
  await page.click("[data-demo=passkey]");
  if (
    !(await page.locator("#passkey-feedback").isVisible()) ||
    !(await page.locator("#current-password").isEnabled())
  )
    throw new Error("Passkey fallback failed");
  results.push({
    direction,
    check: "Passkey cancellation retains password fallback",
    passed: true,
    screenshot: await saveScreenshot(
      await page.screenshot({ fullPage: true }),
      `f7t-${direction}-login-passkey-cancelled-mobile-full.png`,
    ),
  });
  await goto("challenge");
  await page.click("[data-demo=recovery]");
  const recovery = await page.evaluate(() => ({
    label: document.querySelector("label[for=code]").textContent,
    focus: document.activeElement.id,
    inputMode: document.querySelector("#code").inputMode,
  }));
  if (
    recovery.label !== "Recovery code" ||
    recovery.focus !== "code" ||
    recovery.inputMode !== "text"
  )
    throw new Error("Recovery alternative failed");
  results.push({
    direction,
    check: "Recovery alternative updates label, input mode and focus",
    passed: true,
  });
  await goto("profile");
  await page.click("button[type=submit]");
  const loading = await page.locator("button[type=submit]").isDisabled();
  await page.waitForURL("**state=success", { timeout: 3000 });
  if (!loading || !(await page.locator("[role=status]").isVisible()))
    throw new Error("Save feedback failed");
  results.push({ direction, check: "Save disables submit then shows success", passed: true });
  await goto("deletion");
  await page.fill("#current-password", "demo-only");
  await page.locator("#understand").check();
  await page.click("[data-demo=delete]");
  await page.keyboard.press("Shift+Tab");
  if ((await page.evaluate(() => document.activeElement.id)) !== "confirm-dialog")
    throw new Error("Dialog reverse trap failed");
  await page.keyboard.press("Tab");
  if ((await page.evaluate(() => document.activeElement.id)) !== "cancel-dialog")
    throw new Error("Dialog forward trap failed");
  await page.keyboard.press("Escape");
  if ((await page.evaluate(() => document.activeElement.dataset.demo)) !== "delete")
    throw new Error("Dialog focus restoration failed");
  results.push({
    direction,
    check: "Dialog traps focus, Escape closes and restores trigger focus",
    passed: true,
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  if (
    (await page.evaluate(
      () => getComputedStyle(document.querySelector("button")).transitionDuration,
    )) !== "0s"
  )
    throw new Error("Reduced motion failed");
  results.push({ direction, check: "Reduced motion disables transitions", passed: true });
  await goto("profile");
  await page.locator("#name").focus();
  await page.keyboard.press("Tab");
  const focus = await page.evaluate(() => ({
    id: document.activeElement.id,
    width: getComputedStyle(document.activeElement).outlineWidth,
    style: getComputedStyle(document.activeElement).outlineStyle,
  }));
  if (focus.id !== "email" || focus.width !== "3px" || focus.style !== "solid")
    throw new Error("Focus ring failed");
  results.push({
    direction,
    check: "Keyboard focus has a 3px solid ring",
    passed: true,
    screenshot: await saveScreenshot(
      await page.screenshot(),
      `f7t-${direction}-profile-focus-mobile.png`,
    ),
  });
}
console.log(await writeFile("f7t-account-interactions.json", JSON.stringify(results, null, 2)));
console.log(JSON.stringify({ checks: results.length, passed: results.every((row) => row.passed) }));

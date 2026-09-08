// dev-browser --browser f7t-design --headless --timeout 180 run <this-file>
const page = await browser.getPage("account");
const screens = [
  "home",
  "login",
  "register",
  "forgot",
  "reset",
  "verification",
  "confirmation",
  "profile",
  "security",
  "passkeys",
  "authenticator",
  "challenge",
  "recovery",
  "deletion",
];
const selectedStates = new Set([
  "profile:loading",
  "profile:error",
  "passkeys:error",
  "passkeys:empty",
  "challenge:error",
  "verification:success",
  "deletion:success",
  "recovery:empty",
]);
const views = [];
const checks = [];
for (const [viewport, size] of [
  ["desktop", { width: 1440, height: 900 }],
  ["mobile", { width: 390, height: 844 }],
]) {
  await page.setViewportSize(size);
  const goto = async (screen, state = "default") => {
    await page.goto(`http://127.0.0.1:4187/index.html?screen=${screen}&state=${state}`, {
      waitUntil: "load",
    });
    await page.mouse.move(0, 0);
  };
  for (const screen of screens) {
    for (const state of ["default", "loading", "error", "success", "empty"]) {
      await goto(screen, state);
      await page.evaluate(() => document.fonts.ready);
      const metrics = await page.evaluate(() => ({
        width: innerWidth,
        height: innerHeight,
        scrollWidth: document.documentElement.scrollWidth,
        font: document.fonts.check('16px "Space Grotesk"'),
        family: getComputedStyle(document.body).fontFamily,
        labeled: [...document.querySelectorAll("input")].every((input) => input.labels.length > 0),
        buttonsSized: [...document.querySelectorAll("main button")]
          .filter((button) => button.getBoundingClientRect().width)
          .every((button) => button.getBoundingClientRect().height >= 44),
        companionAfterForm: !!(
          document
            .querySelector(".form-panel")
            .compareDocumentPosition(document.querySelector(".companion")) &
          Node.DOCUMENT_POSITION_FOLLOWING
        ),
      }));
      if (
        metrics.scrollWidth > size.width ||
        !metrics.font ||
        !metrics.labeled ||
        !metrics.buttonsSized ||
        !metrics.companionAfterForm
      )
        throw new Error(JSON.stringify({ screen, state, viewport, ...metrics }));
      const row = { screen, state, viewport, ...metrics };
      if (state === "default" || selectedStates.has(`${screen}:${state}`))
        row.screenshot = await saveScreenshot(
          await page.screenshot(),
          `f7t-selected-${screen}-${state}-${viewport}.png`,
        );
      if (state === "default" && viewport === "mobile")
        row.fullScreenshot = await saveScreenshot(
          await page.screenshot({ fullPage: true }),
          `f7t-selected-${screen}-${state}-mobile-full.png`,
        );
      views.push(row);
    }
  }
  await goto("login");
  if (await page.locator(".identity").isVisible())
    throw new Error("Signed-out identity remains visible");
  checks.push({ viewport, check: "Signed-out screen hides account identity", passed: true });
  await page.click("[data-demo=passkey]");
  if (
    !(await page.locator("#passkey-feedback").isVisible()) ||
    !(await page.locator("#current-password").isEnabled())
  )
    throw new Error("Passkey fallback failed");
  checks.push({
    viewport,
    check: "Passkey cancellation retains usable password fallback",
    passed: true,
    screenshot: await saveScreenshot(
      await page.screenshot({ fullPage: true }),
      `f7t-selected-login-passkey-cancelled-${viewport}-full.png`,
    ),
  });
  await goto("challenge");
  await page.click("[data-demo=recovery]");
  if (
    !(await page.evaluate(
      () =>
        document.activeElement.id === "code" &&
        document.querySelector("#code").inputMode === "text" &&
        document.querySelector("label[for=code]").textContent === "Recovery code",
    ))
  )
    throw new Error("Recovery fallback failed");
  checks.push({
    viewport,
    check: "Recovery alternative changes label, input mode, and focus",
    passed: true,
  });
  await goto("profile");
  await page.click("button[type=submit]");
  if (!(await page.locator("button[type=submit]").isDisabled()))
    throw new Error("Missing pending state");
  await page.waitForURL("**state=success", { timeout: 3000 });
  if (!(await page.locator("[role=status]").isVisible())) throw new Error("Missing save success");
  checks.push({ viewport, check: "Save disables action then announces success", passed: true });
  await goto("deletion");
  await page.fill("#current-password", "demo-only");
  await page.locator("#understand").check();
  await page.click("[data-demo=delete]");
  if ((await page.evaluate(() => document.activeElement.id)) !== "cancel-dialog")
    throw new Error("Dialog initial focus failed");
  checks.push({
    viewport,
    check: "Deletion dialog opens with cancel focus",
    passed: true,
    screenshot: await saveScreenshot(
      await page.screenshot(),
      `f7t-selected-deletion-dialog-${viewport}.png`,
    ),
  });
  await page.keyboard.press("Shift+Tab");
  if ((await page.evaluate(() => document.activeElement.id)) !== "confirm-dialog")
    throw new Error("Reverse wrap failed");
  await page.keyboard.press("Tab");
  if ((await page.evaluate(() => document.activeElement.id)) !== "cancel-dialog")
    throw new Error("Forward wrap failed");
  await page.keyboard.press("Escape");
  if ((await page.evaluate(() => document.activeElement.dataset.demo)) !== "delete")
    throw new Error("Dialog focus restore failed");
  checks.push({
    viewport,
    check: "Dialog focus wraps and Escape restores trigger focus",
    passed: true,
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  if (
    (await page.evaluate(
      () => getComputedStyle(document.querySelector("button")).transitionDuration,
    )) !== "0s"
  )
    throw new Error("Reduced motion failed");
  checks.push({ viewport, check: "Reduced motion removes transitions", passed: true });
  await goto("profile");
  await page.locator("#name").focus();
  await page.keyboard.press("Tab");
  const focus = await page.evaluate(() => ({
    id: document.activeElement.id,
    width: getComputedStyle(document.activeElement).outlineWidth,
    style: getComputedStyle(document.activeElement).outlineStyle,
    color: getComputedStyle(document.activeElement).outlineColor,
  }));
  if (focus.id !== "email" || focus.width !== "3px" || focus.style !== "solid")
    throw new Error("Focus ring failed");
  checks.push({
    viewport,
    check: "Keyboard focus has visible 3px ring",
    passed: true,
    ...focus,
    screenshot: await saveScreenshot(
      await page.screenshot(),
      `f7t-selected-profile-focus-${viewport}.png`,
    ),
  });
}
const contrast = await page.evaluate(() => {
  const style = getComputedStyle(document.documentElement);
  const luminance = (hex) => {
    const v = [1, 3, 5]
      .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return v[0] * 0.2126 + v[1] * 0.7152 + v[2] * 0.0722;
  };
  return [
    ["foreground", "background", 4.5],
    ["muted-foreground", "card", 4.5],
    ["muted-foreground", "muted", 4.5],
    ["primary-foreground", "primary", 4.5],
    ["destructive", "muted", 4.5],
    ["success", "muted", 4.5],
    ["companion-muted", "companion", 4.5],
    ["input", "background", 3],
    ["input", "card", 3],
    ["ring", "companion", 3],
  ].map(([foreground, background, minimum]) => {
    const values = [foreground, background].map((name) =>
      style.getPropertyValue(`--${name}`).trim(),
    );
    const light = values.map(luminance).sort((a, b) => a - b);
    const ratio = (light[1] + 0.05) / (light[0] + 0.05);
    return {
      foreground,
      background,
      values,
      ratio: Number(ratio.toFixed(2)),
      minimum,
      passed: ratio >= minimum,
    };
  });
});
if (contrast.some((row) => !row.passed)) throw new Error(JSON.stringify(contrast));
for (const width of [768, 1024]) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto("http://127.0.0.1:4187/index.html?screen=security");
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth))
    throw new Error("Tablet overflow");
  checks.push({ check: "Intermediate-width security has no overflow", width, passed: true });
}
console.log(
  await writeFile(
    "f7t-selected-evidence.json",
    JSON.stringify({ views, checks, contrast }, null, 2),
  ),
);
console.log(
  JSON.stringify({
    views: views.length,
    checks: checks.length,
    contrastPairs: contrast.length,
    passed: true,
  }),
);

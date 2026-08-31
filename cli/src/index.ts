#!/usr/bin/env node
import { parseArgv, resolveConfig } from "./config";
import { createApp } from "./create-app";
import { logNextSteps } from "./next-steps";
import { runWizard } from "./prompts";

const input = parseArgv(process.argv.slice(2));
const resolved =
  input.yes || input.ci ? resolveConfig(input) : resolveConfig(await runWizard(input));
await createApp(resolved);
logNextSteps(resolved);

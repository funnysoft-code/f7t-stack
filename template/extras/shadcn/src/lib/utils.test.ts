import { expect, test } from "vitest";
import { cn } from "./utils";

test("conditional classes preserve variants and let later utilities override conflicts", () => {
  expect(cn("px-2 text-sm", false, { "font-bold": true }, ["px-4", "hover:px-6"])).toBe(
    "text-sm font-bold px-4 hover:px-6",
  );
});

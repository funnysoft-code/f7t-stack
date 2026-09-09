"use client";

import { Passkeys } from "@laravel/passkeys";
import { browserApi } from "./browser";

export const passkeyRoutes = {
  registration: { options: "/api/auth/user/passkeys/options", submit: "/api/auth/user/passkeys" },
  login: { options: "/api/auth/passkeys/login/options", submit: "/api/auth/passkeys/login" },
  confirmation: {
    options: "/api/auth/passkeys/confirm/options",
    submit: "/api/auth/passkeys/confirm",
  },
} as const;

/** 0.4.0's registration type assumes `id`. The backend deliberately returns safe UUID metadata. */
export async function registerPasskey(name: string) {
  await Passkeys.register({ name, routes: passkeyRoutes.registration });
  return browserApi.GET("/auth/user/passkeys");
}

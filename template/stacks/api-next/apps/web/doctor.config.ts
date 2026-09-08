import { defineConfig } from "react-doctor/api";

export default defineConfig({
  ignore: {
    overrides: [
      {
        // These are JSON forms backed by Laravel. A native form navigation or
        // Server Action would bypass the browser-visible cookie rotation contract.
        files: [
          "components/account/account-change-password.tsx",
          "components/account/auth-form.tsx",
          "components/account/confirmation.tsx",
          "components/account/profile-form.tsx",
          "components/screens/authenticator.tsx",
          "components/screens/passkeys.tsx",
        ],
        rules: ["react-doctor/no-prevent-default"],
      },
      {
        // Redirects pass through authDestination/localDestination and the strict
        // signed-path validator. auth.test.ts proves external/internal escapes fail.
        files: ["components/account/server-screen.tsx"],
        rules: ["react-doctor/clickjacking-redirect-risk"],
      },
    ],
  },
});

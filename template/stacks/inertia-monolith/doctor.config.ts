import { defineConfig } from "react-doctor/api";

export default defineConfig({
  ignore: {
    // Dependency sources, generated contracts and standalone design evidence.
    files: [
      "vendor/**",
      "resources/js/actions/**",
      "resources/js/routes/**",
      "resources/js/wayfinder/**",
      "resources/js/types/generated.d.ts",
      "design/mocks/**",
    ],
  },
});

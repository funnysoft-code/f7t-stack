import { createInertiaApp } from "@inertiajs/react";
import { createRoot } from "react-dom/client";
import type { ComponentType } from "react";

void createInertiaApp({
  resolve: (name) => {
    const pages = import.meta.glob<{ default: ComponentType }>("./pages/**/*.tsx");
    const page = pages[`./pages/${name}.tsx`];
    if (!page) throw new Error(`Unknown Inertia page: ${name}`);
    return page().then((module) => module.default);
  },
  setup({ el, App, props }) {
    createRoot(el).render(<App {...props} />);
  },
});

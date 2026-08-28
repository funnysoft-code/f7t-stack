/**
 * Sanity project constants. Read from process.env (not ~/env) so Studio and
 * the Sanity CLI can load this module without the T3 env validator.
 */
export const apiVersion = "2025-01-01";

export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "";

import { client } from "~/sanity/lib/client";
import { siteSettingsQuery } from "~/sanity/lib/queries";

export async function getSiteSettings() {
  if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
    return null;
  }
  return client.fetch(siteSettingsQuery);
}

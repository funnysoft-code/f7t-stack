import type { User } from "@f7t/api-client";

export type AccountProps = {
  account: User | null;
  registration?: boolean;
  returnTo?: string;
  token?: string;
  email?: string;
};

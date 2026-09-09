export type AccountProps = {
  account: App.Data.Users.AccountData | null;
  capabilities: App.Data.Users.AuthCapabilitiesData;
  status?: string | null;
  returnTo?: string;
  token?: string;
  email?: string;
};

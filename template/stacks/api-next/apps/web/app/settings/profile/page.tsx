import Profile from "@/components/screens/profile";
import { ProtectedScreen } from "@/components/account/server-screen";
export default function Page() {
  return <ProtectedScreen screen={Profile} path="/settings/profile" />;
}

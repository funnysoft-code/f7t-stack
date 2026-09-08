import Authenticator from "@/components/screens/authenticator";
import { ProtectedScreen } from "@/components/account/server-screen";
export default function Page() {
  return <ProtectedScreen screen={Authenticator} path="/settings/authenticator" />;
}

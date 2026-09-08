import Passkeys from "@/components/screens/passkeys";
import { ProtectedScreen } from "@/components/account/server-screen";
export default function Page() {
  return <ProtectedScreen screen={Passkeys} path="/settings/passkeys" />;
}

import Security from "@/components/screens/security";
import { ProtectedScreen } from "@/components/account/server-screen";
export default function Page() {
  return <ProtectedScreen screen={Security} path="/settings/security" />;
}

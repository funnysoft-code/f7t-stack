import Recovery from "@/components/screens/recovery";
import { ProtectedScreen } from "@/components/account/server-screen";
export default function Page() {
  return <ProtectedScreen screen={Recovery} path="/settings/recovery" />;
}

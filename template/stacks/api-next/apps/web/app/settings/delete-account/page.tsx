import DeleteAccount from "@/components/screens/delete-account";
import { ProtectedScreen } from "@/components/account/server-screen";
export default function Page() {
  return <ProtectedScreen screen={DeleteAccount} path="/settings/delete-account" />;
}

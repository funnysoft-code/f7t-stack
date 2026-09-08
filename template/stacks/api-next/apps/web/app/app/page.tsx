import Home from "@/components/screens/home";
import { ProtectedScreen } from "@/components/account/server-screen";
export default function Page() {
  return <ProtectedScreen screen={Home} path="/app" />;
}

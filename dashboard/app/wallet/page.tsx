import { getWalletData } from "@/lib/actions";
import WalletDashboard from "@/components/WalletDashboard";

export default async function WalletPage() {
  const walletData = await getWalletData();
  return <WalletDashboard data={walletData} />;
}

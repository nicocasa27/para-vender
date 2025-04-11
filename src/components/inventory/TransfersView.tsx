
import { StockTransferManager } from "./stock-transfer/StockTransferManager";

interface TransfersViewProps {
  onRefresh?: () => void;
}

export function TransfersView({ onRefresh }: TransfersViewProps) {
  return <StockTransferManager onRefreshComplete={onRefresh} />;
}


import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { StockTransferForm } from "./StockTransferForm";
import { TransferHistory } from "./TransferHistory";

export function StockTransferManager() {
  const [refreshHistoryToggle, setRefreshHistoryToggle] = useState(false);

  const handleTransferComplete = () => {
    setRefreshHistoryToggle(!refreshHistoryToggle);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle>Transferir Stock</CardTitle>
          <CardDescription>
            Mueva productos entre sucursales de manera rápida
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StockTransferForm onTransferComplete={handleTransferComplete} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Transferencias</CardTitle>
          <CardDescription>
            Últimas 10 transferencias realizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TransferHistory key={refreshHistoryToggle.toString()} />
        </CardContent>
      </Card>
    </div>
  );
}

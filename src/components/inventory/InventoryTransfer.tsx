
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { TransferForm } from "./TransferForm";
import { TransferHistoryList } from "./TransferHistoryList";

export function InventoryTransfer() {
  const [refreshHistoryToggle, setRefreshHistoryToggle] = useState(false);

  const handleTransferSuccess = () => {
    setRefreshHistoryToggle(!refreshHistoryToggle);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle>Transferir Inventario</CardTitle>
          <CardDescription>
            Mueva productos entre sucursales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TransferForm onTransferSuccess={handleTransferSuccess} />
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
          <TransferHistoryList key={refreshHistoryToggle.toString()} />
        </CardContent>
      </Card>
    </div>
  );
}

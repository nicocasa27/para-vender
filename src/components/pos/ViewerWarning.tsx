
import React from 'react';
import { AlertCircle } from "lucide-react";

interface ViewerWarningProps {
  isViewer: boolean;
}

export function ViewerWarning({ isViewer }: ViewerWarningProps) {
  if (!isViewer) return null;
  
  return (
    <div className="mb-6 p-4 border border-yellow-300 bg-yellow-50 rounded-lg flex items-center gap-3">
      <AlertCircle className="h-5 w-5 text-yellow-600" />
      <div>
        <h3 className="font-medium text-yellow-800">Modo Vista Previa</h3>
        <p className="text-sm text-yellow-700">Tu rol de 'viewer' solo permite visualizar información. No puedes realizar ventas.</p>
      </div>
    </div>
  );
}


import React from "react";
import { useFormContext } from "react-hook-form";
import { ProductFormValues } from "./schema";

interface DebugInfoProps {
  formData: ProductFormValues | null;
}

export const DebugInfo: React.FC<DebugInfoProps> = ({ formData }) => {
  const form = useFormContext();

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <>
      {formData && (
        <div className="mt-4 p-4 bg-gray-100 rounded-md">
          <h3 className="font-semibold mb-2">Datos que se enviarán a Supabase:</h3>
          <pre className="text-xs overflow-auto max-h-40 p-2 bg-black text-green-400 rounded">
            {JSON.stringify(formData, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-4 p-4 bg-gray-100 rounded-md">
        <h3 className="font-semibold mb-2">Valores actuales del formulario:</h3>
        <pre className="text-xs overflow-auto max-h-40 p-2 bg-black text-green-400 rounded">
          {JSON.stringify(form.watch(), null, 2)}
        </pre>
      </div>
    </>
  );
};

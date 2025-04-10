
import React from "react";

interface FormFeedbackProps {
  submitError: string | null;
  submitSuccess: boolean;
  isEditing: boolean;
}

export const FormFeedback: React.FC<FormFeedbackProps> = ({
  submitError,
  submitSuccess,
  isEditing,
}) => {
  if (!submitError && !submitSuccess) {
    return null;
  }

  return (
    <>
      {submitError && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
          <strong>Error:</strong> {submitError}
        </div>
      )}

      {submitSuccess && isEditing && (
        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md text-green-600 text-sm">
          <strong>Éxito:</strong> Los cambios han sido guardados correctamente.
        </div>
      )}
    </>
  );
};


import React from "react";
import { Form } from "@/components/ui/form";
import { useProductForm } from "./product-form/useProductForm";
import { ProductFormProps } from "./product-form/schema";
import { FormProvider } from "react-hook-form";
import { MetadataLoading } from "./product-form/MetadataLoading";
import { ProductFormFields } from "./product-form/ProductFormFields";
import { FormActions } from "./product-form/FormActions";
import { FormFeedback } from "./product-form/FormFeedback";
import { DebugInfo } from "./product-form/DebugInfo";

export const ProductForm: React.FC<ProductFormProps> = ({
  initialData,
  onSubmit,
  isSubmitting = false,
  isEditing = false,
}) => {
  const {
    form,
    formData,
    submitError,
    submitSuccess,
    isLoading,
    hasMetadata,
    categories,
    units,
    warehouses,
    refetchMetadata,
    refetchWarehouses,
    handleFormSubmit,
    handleReset,
  } = useProductForm({
    initialData,
    onSubmit,
    isSubmitting,
    isEditing,
  });

  const loadingComponent = (
    <MetadataLoading
      isLoading={isLoading}
      hasMetadata={hasMetadata}
      categories={categories}
      units={units}
      warehouses={warehouses}
      isEditing={isEditing}
      refetchMetadata={refetchMetadata}
      refetchWarehouses={refetchWarehouses}
    />
  );

  if (loadingComponent && React.isValidElement(loadingComponent)) {
    return loadingComponent;
  }

  return (
    <div>
      <FormProvider {...form}>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="space-y-6 animate-fade-in"
          >
            <ProductFormFields
              categories={categories}
              units={units}
              warehouses={warehouses}
              isEditing={isEditing}
            />

            <FormActions
              isSubmitting={isSubmitting}
              isEditing={isEditing}
              onReset={handleReset}
            />

            <FormFeedback
              submitError={submitError}
              submitSuccess={submitSuccess}
              isEditing={isEditing}
            />
          </form>
        </Form>

        <DebugInfo formData={formData} />
      </FormProvider>
    </div>
  );
};

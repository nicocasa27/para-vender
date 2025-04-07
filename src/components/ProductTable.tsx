import { useState } from "react";
import { useProducts } from "@/hooks/useProducts";
import { ProductTableHeader } from "./ProductTableHeader";
import { ProductTableBody } from "./ProductTableBody";
import { ProductModal } from "./ProductModal";
import { DeleteProductDialog } from "./DeleteProductDialog";
import { ProductHistorySheet } from "./ProductHistorySheet";

const ProductTable = () => {
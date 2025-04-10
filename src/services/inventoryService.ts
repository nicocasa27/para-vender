
import { fetchProductData } from "./productService";
import { fetchCategories } from "./categoryService";
import { fetchStores } from "./storeService";
import { addProduct, updateProduct, deleteProduct } from "./productManagementService";

// Re-exportamos todas las funciones para mantener la interfaz pública
export {
  fetchProductData as fetchProducts,
  fetchCategories,
  fetchStores,
  addProduct,
  updateProduct,
  deleteProduct
};

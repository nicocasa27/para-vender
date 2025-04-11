import {
  fetchItemSalesTrend,
  fetchStoreMonthlySales,
  fetchTotalSalesByStore,
  fetchNonSellingProducts
} from './analytics';
import { fetchTopSellingProducts } from './analytics';

// Exporting the top selling products interface from this file
export interface TopSellingProduct {
  name: string;
  value: number;
}

// Re-export all the analytics functions for backward compatibility
export {
  fetchItemSalesTrend,
  fetchStoreMonthlySales,
  fetchTotalSalesByStore,
  fetchNonSellingProducts,
  fetchTopSellingProducts
};


// This file is kept for backward compatibility
// It re-exports the analytics functions from their specific modules

import { fetchTopSellingProducts } from './analytics/topSellingProducts';
import { fetchItemSalesTrend } from './analytics/itemSalesTrend';
import { fetchStoreMonthlySales } from './analytics/storeMonthlySales';
import { fetchTotalSalesByStore } from './analytics/totalSalesByStore';
import { fetchNonSellingProducts } from './analytics/nonSellingProducts';

export {
  fetchTopSellingProducts,
  fetchItemSalesTrend,
  fetchStoreMonthlySales,
  fetchTotalSalesByStore,
  fetchNonSellingProducts
};

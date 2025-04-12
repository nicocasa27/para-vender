
import { fetchSales, fetchSaleDetails, fetchSalesToday } from "./salesService/fetchSales";
import { createSale } from "./salesService/createSale";
import { Sale, SaleDetail } from "./salesService/types";

export { 
  fetchSales,
  fetchSaleDetails,
  fetchSalesToday,
  createSale
};

export type {
  Sale,
  SaleDetail
};

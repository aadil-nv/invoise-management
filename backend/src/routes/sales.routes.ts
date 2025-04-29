import { Router } from "express";
import {authMiddleware} from "../middlewares/authMiddleware";
import { deleteSale, getAllSales, getSaleById, updateSale,addNewSale ,sendSalesReport, updateSaleIsPaid, updateSaleIsActive} from "../controllers/sales.controller";
import { saleValidation } from "../validators/salesValidators";

export const salesRouter = Router();

salesRouter.post("/add-sale", authMiddleware,saleValidation,addNewSale );
salesRouter.get("/list-sales", authMiddleware,getAllSales);
salesRouter.get("/sale-details/:id",authMiddleware, getSaleById);
salesRouter.put("/update-sale/:id",authMiddleware,saleValidation, updateSale);
salesRouter.delete("/delete-sale/:id", authMiddleware, deleteSale);
salesRouter.patch("/is-paid/:id", authMiddleware, updateSaleIsPaid);
salesRouter.patch("/is-active/:id", authMiddleware, updateSaleIsActive);
salesRouter.post('/send-sales-details', authMiddleware, sendSalesReport);



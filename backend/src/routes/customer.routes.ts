import { Router } from "express";
import { addNewCustomer, getAllCustomers, getCustomerById, updateCustomer ,sendCustomerReport, blockCustomer, getAllListedCustomers } from "../controllers/customer.controller";
import {authMiddleware} from "../middlewares/authMiddleware";
import { customerValidation} from "../validators/customerValidator"

export const customerRouter = Router();

customerRouter.post("/add-customer", authMiddleware,customerValidation, addNewCustomer);
customerRouter.get("/customers", authMiddleware, getAllCustomers);
customerRouter.get("/listed-customers", authMiddleware, getAllListedCustomers);
customerRouter.get("/customer-details/:id", authMiddleware, getCustomerById);
customerRouter.put("/update-customer/:id", authMiddleware,customerValidation, updateCustomer);
// customerRouter.delete("/delete-customer/:id", deleteCustomer);
customerRouter.patch("/block/:id",authMiddleware, blockCustomer);
customerRouter.post('/send-customer-details', authMiddleware, sendCustomerReport);


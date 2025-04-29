import { Router } from "express";
import { addNewProduct, deleteProduct, getAllListedProducts, getAllProducts, getProductById, productListing, sendProductReport, updateProduct } from "../controllers/product.controller";
import {authMiddleware} from "../middlewares/authMiddleware";
import { productValidation } from "../validators/productValidators";

export const productRouter = Router();

productRouter.post("/add-product", authMiddleware,productValidation, addNewProduct);
productRouter.get("/products", authMiddleware, getAllProducts);
productRouter.get("/listed-products", authMiddleware, getAllListedProducts);
productRouter.get("/product/:id",authMiddleware, getProductById);
productRouter.put("/update-product/:id", authMiddleware, productValidation, updateProduct);
productRouter.delete("/delete-product/:id", authMiddleware, deleteProduct);
productRouter.patch("/is-listed/:id", authMiddleware,productListing );
productRouter.post('/send-product-details', authMiddleware, sendProductReport);







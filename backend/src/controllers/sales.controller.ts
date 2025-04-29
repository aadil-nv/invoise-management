import { Response, NextFunction } from "express";
import { Sale } from "../models/sales.scheema";
import { Product } from "../models/product.schema";
import { HttpStatusCode } from "../constants/enums";
import { AuthRequest } from "../utils/interface";
import { validationResult } from "express-validator";
import { User } from "../models/user.scheema";
import { transporter } from "../config/nodeMailer";
import { generateSalesReport,MongoosePopulatedSale } from "../utils/generateSalesReport";
import {SALES_MESSAGES} from "../constants/sales.constants.message"

export const addNewSale = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
          return res.status(HttpStatusCode.BAD_REQUEST).json({ errors: errors.array() });
      }

      const userId = req.user?.id;
      if (!userId) {
          return res.status(HttpStatusCode.UNAUTHORIZED).json({ message: SALES_MESSAGES.USER_NOT_AUTHENTICATED });
      }

      const { products, customerId, paymentMethod, totalPrice, isPaid = false } = req.body;

      if (!Array.isArray(products) || products.length === 0) {
          return res.status(HttpStatusCode.BAD_REQUEST).json({ message: "Products array is required" });
      }

      const saleProducts = [];

      for (const item of products) {
          const { productId, quantity } = item;

          const existingProduct = await Product.findById(productId);
          if (!existingProduct) {
              return res.status(HttpStatusCode.NOT_FOUND).json({ message: `Product not found: ${productId}` });
          }

          if (existingProduct.quantity < quantity) {
              return res.status(HttpStatusCode.BAD_REQUEST).json({ message: `Insufficient stock for product: ${existingProduct.productName}` });
          }

          existingProduct.quantity -= quantity;
          await existingProduct.save();

          saleProducts.push({ productId, quantity });
      }

      const newSale = new Sale({
          userId,
          products: saleProducts,
          customerId,
          paymentMethod,
          totalPrice,
          isPaid,
      });

      await newSale.save();

      return res.status(HttpStatusCode.CREATED).json({
          message: SALES_MESSAGES.SALE_CREATED,
          sale: newSale,
      });
  } catch (error) {
      next(error);
  }
};

export const getAllSales = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({ message: SALES_MESSAGES.USER_NOT_AUTHENTICATED });
    }

    const sales = await Sale.find({ userId }) 
      .populate("products.productId customerId")
      .sort({ date: -1 });

    return res.status(HttpStatusCode.OK).json({ sales });
  } catch (error) {
    next(error);
  }
};

export const getSaleById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const sale = await Sale.findById(id).populate("products.productId customerId");

    if (!sale) {
      return res.status(HttpStatusCode.NOT_FOUND).json({ message: SALES_MESSAGES.SALE_NOT_FOUND });
    }

    return res.status(HttpStatusCode.OK).json({ sale });
  } catch (error) {
    next(error);
  }
};

export const updateSale = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HttpStatusCode.BAD_REQUEST).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { products, paymentMethod, totalPrice, isPaid } = req.body;
    console.log("isPaid ===>",isPaid);
    

    const existingSale = await Sale.findById(id);
    if (!existingSale) {
      return res.status(HttpStatusCode.NOT_FOUND).json({ message: SALES_MESSAGES.SALE_NOT_FOUND });
    }

    for (const oldProduct of existingSale.products) {
      const product = await Product.findById(oldProduct.productId);
      if (product) {
        product.quantity += oldProduct.quantity;
        await product.save();
      }
    }

    for (const newProductData of products) {
      const product = await Product.findById(newProductData.productId);
      if (!product) {
        return res.status(HttpStatusCode.NOT_FOUND).json({ message: SALES_MESSAGES.PRODUCT_NOT_FOUND });
      }

      if (!product.isListed) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          message: `Product "${product.productName}" is not listed and cannot be used in sales.`,
        });
      }

      if (product.quantity < newProductData.quantity) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({ message: SALES_MESSAGES.INSUFFICIENT_STOCK });
      }
    }

    for (const newProductData of products) {
      const product = await Product.findById(newProductData.productId);
      if (product) {
        product.quantity -= newProductData.quantity;
        await product.save();
      }
    }

    existingSale.products = products;
    existingSale.paymentMethod = paymentMethod || existingSale.paymentMethod;
    existingSale.totalPrice = totalPrice || existingSale.totalPrice;
    if (typeof isPaid === 'boolean') {
      existingSale.isPaid = isPaid;
    }

    await existingSale.save();

    return res.status(HttpStatusCode.OK).json({
      message: SALES_MESSAGES.SALE_UPDATED,
      sale: existingSale,
    });
  } catch (error) {
    next(error);
  }
};


export const deleteSale = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const deletedSale = await Sale.findByIdAndDelete(id);

    if (!deletedSale) {
      return res.status(HttpStatusCode.NOT_FOUND).json({ message: SALES_MESSAGES.SALE_NOT_FOUND });
    }

    return res.status(HttpStatusCode.OK).json({ message: SALES_MESSAGES.SALE_DELETED });
  } catch (error) {
    next(error);
  }
};


export const sendSalesReport = async (req: AuthRequest, res: Response, next: NextFunction) => {  
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({ message: SALES_MESSAGES.USER_NOT_AUTHENTICATED });
    }

    const { email, subject, message } = req.body;
    if (!email || !subject || !message) {
      return res.status(HttpStatusCode.BAD_REQUEST).json({ message: SALES_MESSAGES.EMAIL_SUBJECT_MESSAGE_REQUIRED });
    }

    const sales = await Sale.find({ userId })
      .populate("products.productId customerId")
      .sort({ date: -1 }) as unknown as MongoosePopulatedSale[];
      
    if (!sales.length) {
      return res.status(HttpStatusCode.NOT_FOUND).json({ message: SALES_MESSAGES.SALE_NOT_FOUND });
    }

    const userData = await User.findById(userId);
    if (!userData) {
      return res.status(HttpStatusCode.NOT_FOUND).json({ message: SALES_MESSAGES.USER_NOT_FOUND });
    }

    const salesReport = generateSalesReport(sales);

    const mailOptions = {
      from: userData.email,
      to: email,
      subject,
      text: message,
      html: salesReport,
    };

    await transporter.sendMail(mailOptions);

    return res.status(HttpStatusCode.OK).json({ message: SALES_MESSAGES.REPORT_SENT_SUCCESSFULLY });

  } catch (error) {
    console.error("Error sending product report:", error);
    next(error);
  }
};

export const updateSaleIsPaid = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { isPaid } = req.body;

    if (typeof isPaid !== "boolean") {
      return res.status(HttpStatusCode.BAD_REQUEST).json({ message: SALES_MESSAGES.IS_PAID_MUST_BE_BOOLEAN });
    }

    const sale = await Sale.findById(id);
    if (!sale) {
      return res.status(HttpStatusCode.NOT_FOUND).json({ message: SALES_MESSAGES.SALE_NOT_FOUND });
    }

    sale.isPaid = isPaid;
    await sale.save();

    return res.status(HttpStatusCode.OK).json({
      message: SALES_MESSAGES.SALE_PAYMENT_STATUS_UPDATED,
      sale,
    });
  } catch (error) {
    next(error);
  }
};


export const updateSaleIsActive = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(HttpStatusCode.BAD_REQUEST).json({ message: SALES_MESSAGES.IS_PAID_MUST_BE_BOOLEAN });
    }

    const sale = await Sale.findById(id);
    if (!sale) {
      return res.status(HttpStatusCode.NOT_FOUND).json({ message: SALES_MESSAGES.SALE_NOT_FOUND });
    }

    sale.isActive = isActive;
    await sale.save();

    return res.status(HttpStatusCode.OK).json({
      message: SALES_MESSAGES.SALE_ACTIVE_STATUS_UPDATED,
      sale,
    });
  } catch (error) {
    next(error);
  }
};
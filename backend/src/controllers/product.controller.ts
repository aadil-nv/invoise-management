import { Response, NextFunction } from "express";
import { Product } from "../models/product.schema";
import { MESSAGES } from "../constants/constants";
import { AuthRequest } from "../utils/interface";
import { HttpStatusCode } from "../constants/enums";
import { validationResult } from "express-validator";
import { transporter } from "../config/nodeMailer";
import { User } from "../models/user.scheema";
import { generateProductReport } from "../utils/generateProductReport";
import {PRODUCT_MESSAGES} from'../constants/product.message'

export const addNewProduct = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HttpStatusCode.BAD_REQUEST).json({ errors: errors.array() });
    }
    const userId = req.user?.id;
    if (!userId) {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({ message: PRODUCT_MESSAGES.USER_NOT_AUTHENTICATED });
    }

    const { productName, description, quantity, price, isListed = true } = req.body;

    const existingProduct = await Product.findOne({ productName, userId });
    if (existingProduct) {
      return res.status(HttpStatusCode.CONFLICT).json({ message: MESSAGES.PRODUCT_ALREADY_EXISTS });
    }

    const newProduct = new Product({ userId, productName, description, quantity, price, isListed });
    await newProduct.save();

    return res.status(HttpStatusCode.CREATED).json({
      message: PRODUCT_MESSAGES.PRODUCT_CREATED,
      product: newProduct,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllProducts = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({ message: PRODUCT_MESSAGES.USER_NOT_AUTHENTICATED });
    }

    const products = await Product.find({ userId });
    return res.status(HttpStatusCode.OK).json({ products });
  } catch (error) {
    next(error);
  }
};

export const getAllListedProducts = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({ message: PRODUCT_MESSAGES.USER_NOT_AUTHENTICATED });
    }

    const products = await Product.find({ userId, isListed: true });
    return res.status(HttpStatusCode.OK).json({ products });
  } catch (error) {
    next(error);
  }
};


export const getProductById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(HttpStatusCode.NOT_FOUND).json({ message: PRODUCT_MESSAGES.PRODUCT_NOT_FOUND });
    }

    return res.status(HttpStatusCode.OK).json({ product });
  } catch (error) {
    next(error);
  }
};


export const updateProduct = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HttpStatusCode.BAD_REQUEST).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { productName, description, quantity, price, isListed } = req.body;

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { productName, description, quantity, price, isListed },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(HttpStatusCode.NOT_FOUND).json({ message: PRODUCT_MESSAGES.PRODUCT_NOT_FOUND });
    }

    return res.status(HttpStatusCode.OK).json({
      message: PRODUCT_MESSAGES.PRODUCT_UPDATED,
      product: updatedProduct,
    });
  } catch (error) {
    next(error);
  }
};


export const deleteProduct = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res.status(HttpStatusCode.NOT_FOUND).json({ message: PRODUCT_MESSAGES.PRODUCT_NOT_FOUND });
    }

    return res.status(HttpStatusCode.OK).json({
      message: PRODUCT_MESSAGES.PRODUCT_DELETED,
      product: deletedProduct,
    });
  } catch (error) {
    next(error);
  }
};


export const sendProductReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({ message: "User not authenticated" });
    }

    const { email, subject, message } = req.body;
    if (!email || !subject || !message) {
      return res.status(HttpStatusCode.BAD_REQUEST).json({ message: "Email, subject, and message are required" });
    }

    const products = await Product.find({ userId });
    if (!products.length) {
      return res.status(HttpStatusCode.NOT_FOUND).json({ message: "No products found for this user" });
    }

    const userData = await User.findById(userId);
    if (!userData) {
      return res.status(HttpStatusCode.NOT_FOUND).json({ message: "User not found" });
    }

    const productReport = generateProductReport(products);

    const mailOptions = {
      from: userData.email,
      to: email,
      subject,
      text: message,
      html: productReport,
    };

    await transporter.sendMail(mailOptions);

    return res.status(HttpStatusCode.OK).json({ message: "Product report sent successfully" });
  } catch (error) {
    console.error("Error sending product report:", error);
    next(error);
  }
};

export const productListing = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      return res.status(HttpStatusCode.NOT_FOUND).json({ message: PRODUCT_MESSAGES.PRODUCT_NOT_FOUND });
    }

    product.isListed = !product.isListed;
    await product.save();

    return res.status(HttpStatusCode.OK).json({
      message: `Product is now ${product.isListed ? "listed" : "unlisted"}`,
      product,
    });
  } catch (error) {
    next(error);
  }
};

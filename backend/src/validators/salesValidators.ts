import { body } from "express-validator";


export const saleValidation = [
    body("date")
      .notEmpty()
      .withMessage("Date is required")
      .isISO8601()
      .withMessage("Invalid date format (use YYYY-MM-DD)"),
  
    body("products")
      .isArray({ min: 1 })
      .withMessage("At least one product is required"),
  
    body("products.*.productId")
      .notEmpty()
      .withMessage("Product ID is required")
      .isMongoId()
      .withMessage("Invalid product ID format"),
  
    body("products.*.quantity")
      .notEmpty()
      .withMessage("Quantity is required")
      .isInt({ min: 1 })
      .withMessage("Quantity must be a positive integer"),
  
    body("customerId")
      .notEmpty()
      .withMessage("Customer is required"),
  
    body("paymentMethod")
      .notEmpty()
      .withMessage("Payment method is required")
      .isIn(["Cash", "Online", "Credit Card", "Debit Card", "UPI", "Bank Transfer"])
      .withMessage("Invalid payment method"),
  
    body("isPaid")
      .optional()
      .isBoolean()
      .withMessage("isPaid must be a boolean value"),
  ];
  
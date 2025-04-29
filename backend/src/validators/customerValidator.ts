import { body } from "express-validator";


export const customerValidation = [
  body("name").trim().notEmpty().withMessage("Customer name is required"),
  body("email").isEmail().withMessage("Invalid email format"),
  body("mobileNumber")
    .trim()
    .isLength({ min: 10, max: 15 })
    .withMessage("Mobile number must be between 10-15 digits")
    .isNumeric()
    .withMessage("Mobile number must be numeric"),
  body("isBlocked")
    .optional()
    .isBoolean()
    .withMessage("isBlocked must be a boolean value"),
  body("address.street").trim().notEmpty().withMessage("Street is required"),
  body("address.city").trim().notEmpty().withMessage("City is required"),
  body("address.state").trim().notEmpty().withMessage("State is required"),
  body("address.zipCode")
    .trim()
    .isPostalCode("any")
    .withMessage("Invalid zip code"),
  body("address.country").trim().notEmpty().withMessage("Country is required"),
];


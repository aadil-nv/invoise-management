import { Response, NextFunction } from "express";
import { Customer } from "../models/customer.schema";
import { CUSTOMER_MESSAGES } from "../constants/customer.message.constants";
import { HttpStatusCode } from "../constants/enums";
import { AuthRequest } from "../utils/interface";
import { validationResult } from "express-validator";
import { transporter } from "../config/nodeMailer";
import { User } from "../models/user.scheema";
import { generateCustomerReport } from "../utils/generateCustomerReport";

export const addNewCustomer = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HttpStatusCode.BAD_REQUEST).json({ errors: errors.array() });
    }

    const { name, email, mobileNumber, address } = req.body;
    const userId = req.user?.id;

    const existingCustomer = await Customer.findOne({ userId, email });
    const existingMobileNumber = await Customer.findOne({ userId, mobileNumber });

    if (existingCustomer) {
      return res.status(HttpStatusCode.CONFLICT).json({ message: CUSTOMER_MESSAGES.CUSTOMER_ALREADY_EXISTS });
    }

    if (existingMobileNumber) {
      return res.status(HttpStatusCode.CONFLICT).json({ message: CUSTOMER_MESSAGES.MOBILE_NUMBER_ALREADY_EXISTS });
    }

    const newCustomer = new Customer({ userId, name, email, mobileNumber, address });
    await newCustomer.save();

    return res.status(HttpStatusCode.CREATED).json({
      message: CUSTOMER_MESSAGES.CUSTOMER_CREATED,
      customer: newCustomer,
    });

  } catch (error) {
    next(error);
  }
};

export const getAllCustomers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({ message: CUSTOMER_MESSAGES.UNAUTHORIZED });
    }

    const customers = await Customer.find({ userId });
    return res.status(HttpStatusCode.OK).json({ customers });
  } catch (error) {
    next(error);
  }
};

export const getAllListedCustomers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({ message: CUSTOMER_MESSAGES.UNAUTHORIZED });
    }

    const customers = await Customer.find({ userId, isBlocked: false });
    return res.status(HttpStatusCode.OK).json({ customers });
  } catch (error) {
    next(error);
  }
};

export const getCustomerById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findById(id);

    if (!customer) {
      return res.status(HttpStatusCode.NOT_FOUND).json({ message: CUSTOMER_MESSAGES.CUSTOMER_NOT_FOUND });
    }

    return res.status(HttpStatusCode.OK).json({ customer });
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HttpStatusCode.BAD_REQUEST).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { email, mobileNumber } = req.body;

    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(HttpStatusCode.NOT_FOUND).json({ message: CUSTOMER_MESSAGES.CUSTOMER_NOT_FOUND });
    }

    if (email && email !== customer.email) {
      const existingCustomer = await Customer.findOne({ email, _id: { $ne: id } });
      if (existingCustomer) {
        return res.status(HttpStatusCode.CONFLICT).json({ message: CUSTOMER_MESSAGES.CUSTOMER_ALREADY_EXISTS });
      }
    }

    if (mobileNumber && mobileNumber !== customer.mobileNumber) {
      const existingMobile = await Customer.findOne({ mobileNumber, _id: { $ne: id } });
      if (existingMobile) {
        return res.status(HttpStatusCode.CONFLICT).json({ message: CUSTOMER_MESSAGES.MOBILE_NUMBER_ALREADY_EXISTS });
      }
    }

    const updatedCustomer = await Customer.findByIdAndUpdate(id, req.body, { new: true });

    return res.status(HttpStatusCode.OK).json({
      message: CUSTOMER_MESSAGES.CUSTOMER_UPDATED,
      customer: updatedCustomer,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCustomer = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const deletedCustomer = await Customer.findByIdAndDelete(id);

    if (!deletedCustomer) {
      return res.status(HttpStatusCode.NOT_FOUND).json({ message: CUSTOMER_MESSAGES.CUSTOMER_NOT_FOUND });
    }

    return res.status(HttpStatusCode.OK).json({ message: CUSTOMER_MESSAGES.CUSTOMER_DELETED });
  } catch (error) {
    next(error);
  }
};

export const sendCustomerReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({ message: CUSTOMER_MESSAGES.UNAUTHORIZED });
    }

    const { email, subject, message } = req.body;
    if (!email || !subject || !message) {
      return res.status(HttpStatusCode.BAD_REQUEST).json({ message: CUSTOMER_MESSAGES.EMAIL_SUBJECT_MESSAGE_REQUIRED });
    }

    const customers = await Customer.find({ userId });
    if (!customers.length) {
      return res.status(HttpStatusCode.NOT_FOUND).json({ message: CUSTOMER_MESSAGES.NO_CUSTOMERS_FOUND });
    }

    const userData = await User.findById(userId);
    if (!userData) {
      return res.status(HttpStatusCode.NOT_FOUND).json({ message: CUSTOMER_MESSAGES.USER_NOT_FOUND });
    }

    const productReport = generateCustomerReport(customers);

    const mailOptions = {
      from: userData.email,
      to: email,
      subject,
      text: message,
      html: productReport,
    };

    await transporter.sendMail(mailOptions);

    return res.status(HttpStatusCode.OK).json({ message: CUSTOMER_MESSAGES.PRODUCT_REPORT_SENT });
  } catch (error) {
    console.error("Error sending product report:", error);
    next(error);
  }
};

export const blockCustomer = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(HttpStatusCode.NOT_FOUND).json({ message: CUSTOMER_MESSAGES.CUSTOMER_NOT_FOUND });
    }

    customer.isBlocked = !customer.isBlocked;
    await customer.save();

    return res.status(HttpStatusCode.OK).json({
      message: customer.isBlocked ? CUSTOMER_MESSAGES.CUSTOMER_BLOCKED : CUSTOMER_MESSAGES.CUSTOMER_UNBLOCKED,
      customer,
    });
  } catch (error) {
    next(error);
  }
};

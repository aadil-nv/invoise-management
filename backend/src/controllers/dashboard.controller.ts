import { Response, NextFunction } from "express";
import mongoose from "mongoose";
import { Sale } from "../models/sales.scheema";
import { Product } from "../models/product.schema";
import { Customer } from "../models/customer.schema";
import { AuthRequest } from "../utils/interface";
import { HttpStatusCode } from "../constants/enums";
import { DASHBOARD_MESSAGES } from "../constants/dashboard.message";

export const getDashboardData = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({ message: DASHBOARD_MESSAGES.USER_NOT_AUTHENTICATED });
    }

    const userId = new mongoose.Types.ObjectId(req.user.id);

    const totalCustomers = await Customer.countDocuments({ userId });
    const totalSales = await Sale.countDocuments({ userId });
    const totalProducts = await Product.countDocuments({ userId });

    const totalRevenueData = await Sale.aggregate([
      { $match: { userId } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } }
    ]);
    const totalRevenue = totalRevenueData.length > 0 ? totalRevenueData[0].total : 0;

    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    const monthlySales = await Sale.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
          totalSales: { $sum: "$totalPrice" },
          totalOrders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const topProducts = await Sale.aggregate([
      { $match: { userId } },
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.productId",
          totalSold: { $sum: "$products.quantity" }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 3 }
    ]).then(async (products) => {
      return await Product.find({ _id: { $in: products.map(p => p._id) } })
        .select("productName description quantity price")
        .lean();
    });

    const topCustomers = await Sale.aggregate([
      { $match: { userId, customerId: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: "$customerId",
          totalSpent: { $sum: "$totalPrice" }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 3 }
    ]).then(async (customers) => {
      return await Customer.find({ _id: { $in: customers.map(c => c._id) } })
        .select("name email mobileNumber")
        .lean();
    });

    res.status(HttpStatusCode.OK).json({
      message: DASHBOARD_MESSAGES.DASHBOARD_DATA_FETCHED,
      data: {
        totalCustomers,
        totalSales,
        totalProducts,
        totalRevenue,
        averageOrderValue,
        monthlySales,
        topProducts,
        topCustomers
      }
    });
  } catch (error) {
    next(error);
  }
};

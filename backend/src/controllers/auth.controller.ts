import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { validationResult } from "express-validator";
import { AUTH_MESSAGES } from "../constants/auth.message.constants";
import { User } from "../models/user.scheema";
import { HttpStatusCode } from "../constants/enums";
import { generateAccessToken, generateRefreshToken ,verifyRefreshToken } from "../utils/jwt";


export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({ errors: errors.array() });
      }

      const { name, email, password } = req.body;
  
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({ message: AUTH_MESSAGES.USER_ALREADY_EXISTS });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({name, email, password: hashedPassword }); 
      const user =await newUser.save();
  
      const accessToken = generateAccessToken({ id: newUser._id, email: newUser.email });
      const refreshToken = generateRefreshToken({ id: newUser._id, email: newUser.email });

    
  
      res.cookie("accessToken", accessToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const, maxAge: 15 * 60 * 1000 });
      res.cookie("refreshToken", refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const, maxAge: 7 * 24 * 60 * 60 * 1000 });
  
      res.status(HttpStatusCode.CREATED).json({ message: AUTH_MESSAGES.USER_REGISTERED , user});
    } catch (error) {
      next(error);
    }
  };
  

export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HttpStatusCode.BAD_REQUEST).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(HttpStatusCode.BAD_REQUEST).json({ message: AUTH_MESSAGES.INVALID_CREDENTIALS });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(HttpStatusCode.BAD_REQUEST).json({ message: AUTH_MESSAGES.INVALID_CREDENTIALS });
    }

    const accessToken = generateAccessToken({ id: user._id, email: user.email });
    const refreshToken = generateRefreshToken({ id: user._id, email: user.email });
    console.log(accessToken)
    console.log(refreshToken)

    res.cookie("accessToken", accessToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const, maxAge: 15 * 60 * 1000 });
      res.cookie("refreshToken", refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const, maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.status(HttpStatusCode.OK).json({ message: AUTH_MESSAGES.USER_LOGGED_IN ,name:user.name });
  } catch (error) {
    next(error);
  }
};


export const logoutUser = async (req: Request, res: Response, next: NextFunction) => {  
  try {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.status(HttpStatusCode.OK).json({ message: AUTH_MESSAGES.USER_LOGGED_OUT });
  } catch (error) {
    next(error);
  }
}

export const setNewAccessToken =async (req: Request, res: Response, next: NextFunction) => {
  
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(HttpStatusCode.FORBIDDEN).json({ message: AUTH_MESSAGES.UNAUTHORIZED });
    }
    
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(HttpStatusCode.FORBIDDEN).json({ message: AUTH_MESSAGES.UNAUTHORIZED });
    }
    const accessToken = generateAccessToken({ id: decoded.id, email: decoded.email });
    res.cookie("accessToken", accessToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "none", maxAge: 15 * 60 * 1000 });    
    res.status(HttpStatusCode.OK).json({ message: AUTH_MESSAGES.ACCESS_TOKEN_UPDATED });
  } catch (error) {
    next(error);
  }
}
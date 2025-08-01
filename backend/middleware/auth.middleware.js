import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;

    if (!accessToken) {
      return res.status(401).json({ message: "Unauthorized - no access token provided" });
    }

    try {
      const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
      const user = await User.findById(decoded.userId);

      if (!user) {
        return res.status(401).json({ message: "Unauthorized - user not found" });
      }

      req.user = user; // Attach user to request object

      next(); // Proceed to the next middleware or route handler

    } catch (error) {
      if(error.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Unauthorized - access token expired" });
      }
      throw error
    } 
  } catch (error) {
    console.log("Error in protectRoute middleware:", error.message);
    res.status(401).json({ message: "Unauthorized - invalid access token" });
    
  }
}

export const adminRoute = (req, res, next) => {
  if(req.user && req.user.role === "admin") {
    next(); // User is admin, proceed to the next middleware or route handler
  }else {
    return res.status(403).json({ message: "Access Denied - admin access required" });
  }
}
// middlewares/authMiddleware.js
import jwt from "jsonwebtoken";
import "dotenv/config";

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token missing or invalid" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Contiendra userId, role, etc.
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export const validateRegister = (req, res, next) => {
  console.log("BODY EN PRODUCTION:", req.body);
  const { email, password, first_name, last_name } = req.body;
  if (!email || !password || !first_name || !last_name) {
    return res.status(400).json({ message: "All fields are required" });
  }
  next();
};

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }
  next();
};

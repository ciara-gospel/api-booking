import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "../config/db.js";
import "dotenv/config";

const generateToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1d" });

export const registerUser = async (req, res) => {
  const { first_name, last_name, email, password } = req.body;
  try {
    const existing = await query(`SELECT id FROM users WHERE email = $1`, [
      email,
    ]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await query(
      `INSERT INTO users (first_name, last_name, email, password)
         VALUES ($1, $2, $3, $4) RETURNING id, email`,
      [first_name, last_name, email, hashedPassword]
    );

    const token = generateToken({ id: result.rows[0].id, role: "user" });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: result.rows[0].id,
        email: result.rows[0].email,
      },
      token,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Registration failed", error: err.message });
  }
};

export const registerProvider = async (req, res) => {
  const { first_name, last_name, email, password, service_name } = req.body;

  if (!first_name || !last_name || !email || !password || !service_name) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const existingUser = await query(`SELECT id FROM users WHERE email = $1`, [
      email,
    ]);

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertion utilisateur
    const userRes = await query(
      `INSERT INTO users (first_name, last_name, email, password)
         VALUES ($1, $2, $3, $4) RETURNING id`,
      [first_name, last_name, email, hashedPassword]
    );

    const user_id = userRes.rows[0]?.id;
    if (!user_id) {
      throw new Error("User ID not returned from insert.");
    }

    // Insertion du fournisseur de services
    const providerRes = await query(
      `INSERT INTO service_providers (user_id, service_name, email)
         VALUES ($1, $2, $3) RETURNING id`,
      [user_id, service_name, email]
    );

    const token = generateToken({
      id: providerRes.rows[0].id,
      role: "provider",
    });

    res.status(201).json({
      message: "Provider registered successfully",
      user: {
        id: user_id,
        first_name,
        email,
        service_name,
      },
      token,
    });
  } catch (err) {
    console.error("Erreur lors de l'inscription du provider:", err); // LOG POUR DÉBOGAGE
    res.status(500).json({
      message: "Provider registration failed",
      error: err.message,
    });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const userRes = await query(
      `SELECT id, first_name, last_name, email, password FROM users WHERE email = $1`,
      [email]
    );

    if (userRes.rows.length === 0)
      return res.status(401).json({ message: "Invalid email or password" });

    const user = userRes.rows[0];

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ message: "Invalid email or password" });

    const providerRes = await query(
      `SELECT id, service_name FROM service_providers WHERE user_id = $1`,
      [user.id]
    );

    const isProvider = providerRes.rows.length > 0;
    const role = isProvider ? "provider" : "user";

    const token = generateToken({ id: user.id, role });

    const responseData = {
      id: user.id,
      email: user.email,
      role,
    };

    if (isProvider) {
      responseData.service_name = providerRes.rows[0].service_name;
    }

    res.status(200).json({
      message: "Login successful",
      user: responseData,
      token,
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
};

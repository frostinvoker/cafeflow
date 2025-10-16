import { Router } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = Router();

function signToken(userId, secret) {
  return jwt.sign({ sub: userId }, secret, { expiresIn: "7d" });
}

router.post("/register", async (req, res) => {
  try {
    const { email, name, password } = req.body;
    if (!email || !name || !password) return res.status(400).json({ message: "Missing fields" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: "Email already registered" });

    const user = new User({ email, name });
    await user.setPassword(password);
    await user.save();

    res.status(201).json({ message: "Registered" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const { JWT_SECRET, COOKIE_NAME } = process.env;

    const user = await User.findOne({ email });
    if (!user || !(await user.validatePassword(password))) {
      return res.status(401).json({ message: "Invalid Email or Password" });
    }

    const token = signToken(user._id.toString(), JWT_SECRET);
    res
        res.cookie(process.env.COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.COOKIE_SECURE === "true",
        maxAge: 7*24*60*60*1000
        }).json({ user: { id: user._id, email: user.email, name: user.name }});
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/logout", (req, res) => {
  const { COOKIE_NAME } = process.env;
  res.clearCookie(COOKIE_NAME, { httpOnly: true, sameSite: "lax", secure: process.env.COOKIE_SECURE === "true" });
  res.json({ message: "Logged out" });
});

export default router;

import jwt from "jsonwebtoken";

export default function requireAuth(req, res, next) {
  const { COOKIE_NAME, JWT_SECRET } = process.env;
  const token = req.cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

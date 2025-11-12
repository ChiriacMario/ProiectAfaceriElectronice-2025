import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "secretul_meu_super_tare";

export function verificaToken(req, res, next) {
  const h = req.headers.authorization;
  if (!h) return res.status(401).json({ mesaj: "Token lipsa." });
  
  const token = h.split(" ")[1];
  if (!token) return res.status(401).json({ mesaj: "Token invalid." });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.status(403).json({ mesaj: "Token invalid sau expirat." });
  }
}

export function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: "2h" }
  );
}
import express from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../server.js";
import { signToken } from "../middleware/auth.js";

const router = express.Router();

export const register = async (req, res) => {
  const { username, email, password, firstName, lastName, phone } = req.body;
  if (!username || !email || !password || !firstName || !lastName)
    return res.status(400).json({ mesaj: "Completează câmpurile obligatorii." });

  const dup = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
  if (dup) return res.status(409).json({ mesaj: "Email sau username deja folosit." });

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { username, email, password: hashed, firstName, lastName, phone: phone || null },
    select: { id: true, username: true, email: true, role: true, firstName: true, lastName: true, phone: true }
  });

  const token = signToken(user);
  res.status(201).json({ mesaj: "Cont creat.", token, user });
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  const u = await prisma.user.findUnique({ where: { email } });
  if (!u) return res.status(404).json({ mesaj: "Utilizatorul nu există." });

  const ok = await bcrypt.compare(password, u.password);
  if (!ok) return res.status(401).json({ mesaj: "Parolă incorectă." });

  const user = (({ id, username, email, role, firstName, lastName, phone }) =>
    ({ id, username, email, role, firstName, lastName, phone }))(u);

  const token = signToken(u);
  res.json({ mesaj: "Autentificare reușită.", token, user });
};

router.post("/register", register);
router.post("/login", login);

export default router;
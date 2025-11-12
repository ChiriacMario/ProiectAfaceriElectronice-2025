import express from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../server.js";
import { verificaToken } from "../middleware/auth.js";

const router = express.Router();

export const getProfile = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, username: true, email: true, role: true, firstName: true, lastName: true, phone: true, createdAt: true, updatedAt: true, addresses: true }
  });
  if (!user) return res.status(404).json({ mesaj: "Utilizator inexistent." });

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { items: { include: { book: { select: { id: true, title: true, imageUrl: true } } } }, shipping: true, payment: true }
  });

  res.json({ user, orders });
};

export const updateProfile = async (req, res) => {
  const userId = req.user.id;
  const { username, email, phone, currentPassword, newPassword, firstName, lastName } = req.body;

  if (email) {
    const ex = await prisma.user.findFirst({ where: { email, NOT: { id: userId } } });
    if (ex) return res.status(409).json({ mesaj: "Emailul este deja folosit." });
  }
  if (username) {
    const ex = await prisma.user.findFirst({ where: { username, NOT: { id: userId } } });
    if (ex) return res.status(409).json({ mesaj: "Username-ul este deja folosit." });
  }

  const data = {
    ...(username && { username }),
    ...(email && { email }),
    ...(phone !== undefined && { phone }),
    ...(firstName && { firstName }),
    ...(lastName && { lastName }),
  };

  if (newPassword) {
    if (!currentPassword) return res.status(400).json({ mesaj: "Parola curentă necesară." });
    const u = await prisma.user.findUnique({ where: { id: userId } });
    const ok = await bcrypt.compare(currentPassword, u.password);
    if (!ok) return res.status(401).json({ mesaj: "Parola curentă este incorectă." });
    data.password = await bcrypt.hash(newPassword, 10);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, username: true, email: true, role: true, firstName: true, lastName: true, phone: true, updatedAt: true }
  });

  res.json({ mesaj: "Profil actualizat.", user: updated });
};

export const deleteAccount = async (req, res) => {
  const { currentPassword } = req.body || {};
  if (!currentPassword) return res.status(400).json({ mesaj: "Parola curentă necesară." });

  const u = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!u) return res.status(404).json({ mesaj: "Utilizator inexistent." });

  const ok = await bcrypt.compare(currentPassword, u.password);
  if (!ok) return res.status(401).json({ mesaj: "Parola curentă este incorectă." });

  await prisma.$transaction(async (tx) => {
    const orders = await tx.order.findMany({ where: { userId: u.id }, select: { id: true } });
    const ids = orders.map(o => o.id);
    if (ids.length) {
      await tx.orderItem.deleteMany({ where: { orderId: { in: ids } } });
      await tx.payment.deleteMany({ where: { orderId: { in: ids } } });
      await tx.orderAddress.deleteMany({ where: { orderId: { in: ids } } });
      await tx.order.deleteMany({ where: { id: { in: ids } } });
    }
    await tx.address.deleteMany({ where: { userId: u.id } });
    await tx.user.delete({ where: { id: u.id } });
  });

  res.status(204).send();
};

router.get("/profil", verificaToken, getProfile);
router.put("/profil", verificaToken, updateProfile);
router.delete("/cont", verificaToken, deleteAccount);

export default router;
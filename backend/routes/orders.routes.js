import express from "express";
import { prisma } from "../server.js";
import { D } from "../middleware/money.js";

const router = express.Router();

export const listMyOrders = async (req, res) => {
  const comenzi = await prisma.order.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
    include: { items: { include: { book: true } }, shipping: true, payment: true }
  });
  res.json(comenzi);
};

export const checkout = async (req, res) => {
  const { items, paymentMethod, shippingAddressId, shipping } = req.body;
  if (!Array.isArray(items) || !items.length) return res.status(400).json({ mesaj: "Coș gol." });
  if (!paymentMethod) return res.status(400).json({ mesaj: "Alege metoda de plată." });

  const qtyByBook = new Map();
  for (const { bookId, quantity } of items) {
    const id = Number(bookId);
    const q = Number(quantity);
    if (!id || !q || q < 1) return res.status(400).json({ mesaj: "Articole invalide." });
    qtyByBook.set(id, (qtyByBook.get(id) || 0) + q);
  }
  const bookIds = [...qtyByBook.keys()];

  try {
    const comanda = await prisma.$transaction(async (tx) => {
      const books = await tx.book.findMany({ where: { id: { in: bookIds } }, select: { id: true, title: true, price: true, stock: true } });

      if (books.length !== bookIds.length) {
        const gasite = new Set(books.map(b => b.id));
        const lipsa = bookIds.filter(id => !gasite.has(id));
        const e = new Error(`Cartea/ cărțile cu ID-urile ${lipsa.join(", ")} nu există.`);
        e.code = "NOT_FOUND";
        throw e;
      }

      const insuf = [];
      for (const b of books) {
        const q = qtyByBook.get(b.id);
        if (b.stock < q) insuf.push(`${b.title} (stoc: ${b.stock}, cerut: ${q})`);
      }
      if (insuf.length) {
        const e = new Error(`Stoc insuficient pentru: ${insuf.join("; ")}`);
        e.code = "STOC_INSUFICIENT";
        throw e;
      }

      for (const [id, q] of qtyByBook.entries()) {
        const upd = await tx.book.updateMany({ where: { id, stock: { gte: q } }, data: { stock: { decrement: q } } });
        if (upd.count !== 1) {
          const e = new Error(`Stoc insuficient în timpul procesării (cartea #${id}).`);
          e.code = "STOC_INSUFICIENT";
          throw e;
        }
      }

      let total = D(0);
      const orderItemsData = books.map((b) => {
        const q = qtyByBook.get(b.id);
        const unitPrice = D(b.price);
        const subtotal = unitPrice.mul(q);
        total = total.add(subtotal);
        return { bookId: b.id, quantity: q, unitPrice, subtotal };
      });

      const order = await tx.order.create({
        data: { userId: req.user.id, status: "plasata", paymentMethod, total, items: { create: orderItemsData } }
      });

      let shippingData = null;
      if (shippingAddressId) {
        const adr = await tx.address.findFirst({ where: { id: Number(shippingAddressId), userId: req.user.id } });
        if (!adr) { const e = new Error("Adresa selectată nu există."); e.code = "BAD_ADDRESS"; throw e; }
        shippingData = { orderId: order.id, recipient: `${req.user.username}`, line1: adr.line1, line2: adr.line2, city: adr.city, region: adr.region, postalCode: adr.postalCode, country: adr.country, phone: null };
      } else if (shipping && shipping.line1 && shipping.city) {
        shippingData = { orderId: order.id, recipient: shipping.recipient || "", line1: shipping.line1, line2: shipping.line2 || null, city: shipping.city, region: shipping.region || null, postalCode: shipping.postalCode || null, country: shipping.country || "RO", phone: shipping.phone || null };
      }
      if (shippingData) await tx.orderAddress.create({ data: shippingData });

      await tx.payment.create({ data: { orderId: order.id, method: paymentMethod, status: "PENDING", amount: total, currency: "RON", provider: null, providerPaymentId: null } });

      return tx.order.findUnique({ where: { id: order.id }, include: { items: { include: { book: true } }, shipping: true, payment: true } });
    });

    res.status(201).json({ mesaj: "Comandă plasată.", comanda });
  } catch (e) {
    if (e.code === "STOC_INSUFICIENT") return res.status(409).json({ mesaj: e.message });
    if (e.code === "BAD_ADDRESS") return res.status(400).json({ mesaj: e.message });
    if (e.code === "NOT_FOUND") return res.status(404).json({ mesaj: e.message });
    throw e;
  }
};

router.get("/comenzi", listMyOrders);
router.post("/checkout", checkout);

export default router;
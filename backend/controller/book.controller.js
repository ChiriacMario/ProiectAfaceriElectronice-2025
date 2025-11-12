// src/controllers/books.controller.js
import { D } from "../middleware/money.js";

export const listGenres = async (_req, res) => {
  const rows = await prisma.book.findMany({ where: { genre: { not: null } }, select: { genre: true } });
  const genuri = [...new Set(rows.map(r => r.genre).filter(Boolean))].sort();
  res.json(genuri);
};

export const listBooks = async (req, res) => {
  const { q, gen, autor, pretMin, pretMax, stocMin, sort = "nou", page = 1, limit = 12 } = req.query;

  const pageNum = Math.max(parseInt(page) || 1, 1);
  const take = Math.min(Math.max(parseInt(limit) || 12, 1), 48);
  const skip = (pageNum - 1) * take;

  const where = {};
  if (q && q.trim()) where.OR = [
    { title: { contains: q } }, { author: { contains: q } }, { genre: { contains: q } }
  ];
  if (gen) {
    const g = gen.split(",").map(s => s.trim()).filter(Boolean);
    if (g.length === 1) where.genre = g[0];
    else if (g.length > 1) where.genre = { in: g };
  }
  if (autor) {
    const a = autor.split(",").map(s => s.trim()).filter(Boolean);
    if (a.length === 1) where.author = a[0];
    else if (a.length > 1) where.author = { in: a };
  }
  if (pretMin || pretMax) {
    where.price = {};
    if (pretMin) where.price.gte = Number(pretMin);
    if (pretMax) where.price.lte = Number(pretMax);
  }
  if (stocMin) where.stock = { gte: Number(stocMin) };

  let orderBy = [{ createdAt: "desc" }];
  if (sort === "price_asc") orderBy = [{ price: "asc" }];
  if (sort === "price_desc") orderBy = [{ price: "desc" }];
  if (sort === "titlu") orderBy = [{ title: "asc" }];

  const [total, items] = await Promise.all([
    prisma.book.count({ where }),
    prisma.book.findMany({ where, orderBy, skip, take })
  ]);

  res.json({ meta: { total, page: pageNum, limit: take, pages: Math.ceil(total / take) || 1 }, items });
};

export const getBook = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ mesaj: "ID invalid." });
  const book = await prisma.book.findUnique({ where: { id } });
  if (!book) return res.status(404).json({ mesaj: "Cartea nu există." });
  res.json(book);
};

export const createBook = async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ mesaj: "Doar admin." });
  const { title, author, genre, price, stock, description, imageUrl, isbn13, publisher, publishedAt } = req.body;
  const carte = await prisma.book.create({
    data: {
      title, author: author || null, genre: genre || null,
      price: D(price || 0), stock: stock ?? 0, description: description || null, imageUrl: imageUrl || null,
      isbn13: isbn13 || null, publisher: publisher || null, publishedAt: publishedAt ? new Date(publishedAt) : null
    }
  });
  res.status(201).json({ mesaj: "Cartea a fost adăugată.", carte });
};

export const deleteBook = async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ mesaj: "Doar admin." });
  const id = Number(req.params.id);
  await prisma.book.delete({ where: { id } });
  res.json({ mesaj: "Cartea a fost ștearsă." });
};

export default router;
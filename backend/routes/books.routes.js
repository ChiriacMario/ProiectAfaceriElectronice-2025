import express from "express";
import { prisma } from "../server.js";
import { D } from "../middleware/money.js";
import { verificaToken } from "../middleware/auth.js";

const router = express.Router();

export const listGenres = async (_req, res) => {
  try {
    const rows = await prisma.book.findMany({ 
      where: { genre: { not: null } }, 
      select: { genre: true } 
    });
    const genuri = [...new Set(rows.map(r => r.genre).filter(Boolean))].sort();
    res.json(genuri);
  } catch (e) {
    console.error("Eroare listGenres:", e);
    res.status(500).json({ mesaj: "Eroare la preluarea genurilor." });
  }
};

export const listBooks = async (req, res) => {
  try {
    const { q, gen, autor, pretMin, pretMax, stocMin, sort = "nou", page = 1, limit = 12 } = req.query;

    const pageNum = Math.max(parseInt(page) || 1, 1);
    const take = Math.min(Math.max(parseInt(limit) || 12, 1), 48);
    const skip = (pageNum - 1) * take;

    const where = {};

    if (q && q.trim()) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { author: { contains: q, mode: "insensitive" } },
        { genre: { contains: q, mode: "insensitive" } }
      ];
    }

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

    res.json({ 
      meta: { 
        total, 
        page: pageNum, 
        limit: take, 
        pages: Math.ceil(total / take) || 1 
      }, 
      items 
    });
  } catch (e) {
    console.error("Eroare listBooks:", e);
    res.status(500).json({ mesaj: "Eroare la preluarea cărților." });
  }
};

export const getBook = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ mesaj: "ID invalid." });
    const book = await prisma.book.findUnique({ where: { id } });
    if (!book) return res.status(404).json({ mesaj: "Cartea nu există." });
    res.json(book);
  } catch (e) {
    console.error("Eroare getBook:", e);
    res.status(500).json({ mesaj: "Eroare la preluarea cărții." });
  }
};

export const createBook = async (req, res) => {
  try {
    if (req.user?.role !== "admin") return res.status(403).json({ mesaj: "Doar admin." });
    const { title, author, genre, price, stock, description, imageUrl, isbn13, publisher, publishedAt } = req.body;
    
    if (!title || price === undefined || stock === undefined) {
      return res.status(400).json({ mesaj: "Titlu, preț și stoc sunt obligatorii." });
    }

    const carte = await prisma.book.create({
      data: {
        title, 
        author: author || null, 
        genre: genre || null,
        price: D(price || 0), 
        stock: Number(stock) ?? 0, 
        description: description || null, 
        imageUrl: imageUrl || null,
        isbn13: isbn13 || null, 
        publisher: publisher || null, 
        publishedAt: publishedAt ? new Date(publishedAt) : null
      }
    });
    res.status(201).json({ mesaj: "Cartea a fost adăugată.", carte });
  } catch (e) {
    console.error("Eroare createBook:", e);
    res.status(500).json({ mesaj: "Eroare la crearea cărții." });
  }
};

export const updateBook = async (req, res) => {
  try {
    if (req.user?.role !== "admin") return res.status(403).json({ mesaj: "Doar admin." });
    const id = Number(req.params.id);
    const { title, author, genre, price, stock, description, imageUrl, isbn13, publisher, publishedAt } = req.body;
    
    const updated = await prisma.book.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(author !== undefined && { author: author || null }),
        ...(genre !== undefined && { genre: genre || null }),
        ...(price !== undefined && { price: D(price) }),
        ...(stock !== undefined && { stock: Number(stock) }),
        ...(description !== undefined && { description: description || null }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl || null }),
        ...(isbn13 !== undefined && { isbn13: isbn13 || null }),
        ...(publisher !== undefined && { publisher: publisher || null }),
        ...(publishedAt !== undefined && { publishedAt: publishedAt ? new Date(publishedAt) : null }),
      }
    });
    res.json({ mesaj: "Cartea a fost actualizată.", carte: updated });
  } catch (e) {
    console.error("Eroare updateBook:", e);
    res.status(500).json({ mesaj: "Eroare la actualizarea cărții." });
  }
};

export const deleteBook = async (req, res) => {
  try {
    if (req.user?.role !== "admin") return res.status(403).json({ mesaj: "Doar admin." });
    const id = Number(req.params.id);
    await prisma.book.delete({ where: { id } });
    res.json({ mesaj: "Cartea a fost ștearsă." });
  } catch (e) {
    console.error("Eroare deleteBook:", e);
    res.status(500).json({ mesaj: "Eroare la ștergerea cărții." });
  }
};

router.get("/carti", listBooks);
router.get("/carti/:id", getBook);

router.get("/books", verificaToken, listBooks);        
router.get("/books/genres", verificaToken, listGenres); 
router.get("/books/:id", verificaToken, getBook);      
router.post("/books", verificaToken, createBook);      
router.put("/books/:id", verificaToken, updateBook);   
router.delete("/books/:id", verificaToken, deleteBook);

router.post("/carti", verificaToken, createBook);
router.delete("/carti/:id", verificaToken, deleteBook);

export default router;
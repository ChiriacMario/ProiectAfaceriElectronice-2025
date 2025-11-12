import authRouter from "./routes/auth.routes.js";
import usersRouter from "./routes/users.routes.js";
import booksRouter from "./routes/books.routes.js";
import addressesRouter from "./routes/addresses.routes.js";
import ordersRouter from "./routes/orders.routes.js";

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { verificaToken } from "./middleware/auth.js";

import { PrismaClient } from "@prisma/client";
export const prisma = new PrismaClient();

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Public routes (no auth needed)
app.use("/api/auth", authRouter);
app.use("/api", booksRouter);

// Protected routes (need token)
app.use("/api", verificaToken, usersRouter);
app.use("/api", verificaToken, addressesRouter);
app.use("/api", verificaToken, ordersRouter);
app.use("/api/cont", verificaToken, usersRouter);
app.use("/api/adrese", verificaToken, addressesRouter);
app.use("/api/comenzi", verificaToken, ordersRouter);
app.use("/api/checkout", verificaToken, ordersRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Serverul rulează pe portul ${PORT}`);
});
// src/components/BookCard.js
import { Link } from "react-router-dom";

export default function BookCard({ book, onAdd }) {
  return (
    <div className="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden relative">

      <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md">
        În stoc: {book.stock}
      </div>

      <Link to={`/book/${book.id}`}>
        <img
          src={book.imageUrl || "https://via.placeholder.com/200x300"}
          alt={book.title}
          className="w-full h-64 object-cover"
        />
      </Link>

      <div className="p-4">

        <Link to={`/book/${book.id}`}>
          <h2 className="text-lg font-semibold text-slate-800 hover:text-indigo-600 transition">
            {book.title}
          </h2>
        </Link>

        <p className="text-sm text-slate-500">{book.author || "Autor necunoscut"}</p>
        <p className="text-indigo-600 font-bold mt-2">
          {book.price.toLocaleString("ro-RO", { minimumFractionDigits: 2 })} RON
        </p>

        <button
          onClick={() => onAdd?.(book)}
          className="mt-3 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg transition"
        >
          Adaugă în coș
        </button>
      </div>
    </div>
  );
}

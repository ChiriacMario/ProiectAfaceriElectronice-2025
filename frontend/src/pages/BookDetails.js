import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";
import { toast } from "react-toastify";

export default function BookDetails() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");

    api.get(`/carti/${id}`)
      .then((res) => {
        if (!alive) return;
        setBook(res.data);
      })
      .catch((err) => {
        console.error(err);
        if (!alive) return;
        setError("Eroare la încărcarea cărții.");
      })
      .finally(() => alive && setLoading(false));

    return () => { alive = false; };
  }, [id]);

  const outOfStock = useMemo(() => (book?.stock ?? 0) <= 0, [book]);

  const addToCart = () => {
    if (!book) return;
    if (outOfStock) {
      toast.info("Stoc epuizat pentru această carte.");
      return;
    }
    try {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      const i = cart.findIndex((it) => it.id === book.id);
      if (i === -1) {
        cart.push({
          id: book.id,
          title: book.title,
          price: Number(book.price),
          qty: 1,
          imageUrl: book.imageUrl,
          author: book.author,
        });
      } else {
        cart[i].qty += 1;
      }
      localStorage.setItem("cart", JSON.stringify(cart));
      window.dispatchEvent(new Event("cart:updated"));
      toast.success(`„${book.title}” a fost adăugată în coș.`, { icon: "🛒" });
    } catch {
      toast.error("Nu am putut adăuga în coș.");
    }
  };

  // helpers
  const fmtMoney = (v) =>
    Number(v).toLocaleString("ro-RO", { minimumFractionDigits: 2 }) + " RON";
  const fmtDate = (d) => (d ? new Date(d).toLocaleString("ro-RO") : "-");

  if (loading) return <div className="p-8 text-center text-slate-600 text-lg">Se încarcă detaliile cărții...</div>;
  if (error)   return <div className="p-8 text-center text-rose-600 text-lg">{error}</div>;
  if (!book)   return <div className="p-8 text-center text-slate-600">Cartea nu a fost găsită.</div>;

  return (
    <div className="p-6 sm:p-10 bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto bg-white shadow rounded-xl overflow-hidden">
        <div className="md:flex">

          <div className="md:w-1/3">
            <img
              src={book.imageUrl || "https://via.placeholder.com/400x500"}
              alt={book.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="md:w-2/3 p-6">
            <h1 className="text-2xl font-bold text-slate-800 mb-1">{book.title}</h1>
            <p className="text-slate-500 mb-3">
              {book.author ? `de ${book.author}` : "Autor necunoscut"}
            </p>

            <div className="flex items-center gap-3 mb-4">
              <span className="text-indigo-600 font-bold text-lg">{fmtMoney(book.price)}</span>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  outOfStock ? "bg-slate-200 text-slate-600" : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {outOfStock ? "Stoc epuizat" : `În stoc: ${book.stock}`}
              </span>
            </div>

            {book.description && (
              <p className="text-slate-700 mb-6">{book.description}</p>
            )}

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm text-slate-700 mb-6">
              {book.genre && (
                <>
                  <dt className="text-slate-500">Gen</dt>
                  <dd className="font-medium">{book.genre}</dd>
                </>
              )}
              {book.publisher && (
                <>
                  <dt className="text-slate-500">Editură</dt>
                  <dd className="font-medium">{book.publisher}</dd>
                </>
              )}
              {book.isbn13 && (
                <>
                  <dt className="text-slate-500">ISBN-13</dt>
                  <dd className="font-medium">{book.isbn13}</dd>
                </>
              )}
              {book.publishedAt && (
                <>
                  <dt className="text-slate-500">Publicată</dt>
                  <dd className="font-medium">{fmtDate(book.publishedAt)}</dd>
                </>
              )}
              {book.createdAt && (
                <>
                  <dt className="text-slate-500">Creată</dt>
                  <dd className="font-medium">{fmtDate(book.createdAt)}</dd>
                </>
              )}
              {book.updatedAt && (
                <>
                  <dt className="text-slate-500">Actualizată</dt>
                  <dd className="font-medium">{fmtDate(book.updatedAt)}</dd>
                </>
              )}
            </dl>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={addToCart}
                disabled={outOfStock}
                className={`px-5 py-2 rounded-lg transition text-white ${
                  outOfStock ? "bg-slate-300 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {outOfStock ? "Stoc epuizat" : "Adaugă în coș"}
              </button>

              <Link
                to="/"
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-5 py-2 rounded-lg transition"
              >
                ← Înapoi la listă
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

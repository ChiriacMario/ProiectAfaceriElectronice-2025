import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { toast } from "react-toastify";

const cn = (...c) => c.filter(Boolean).join(" ");

export default function Admin() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Books
  const [books, setBooks] = useState([]);
  const [booksLoading, setBooksLoading] = useState(false);
  const [showAddBook, setShowAddBook] = useState(false);
  const [editingBook, setEditingBook] = useState(null);

  const [bookForm, setBookForm] = useState({
    title: "",
    author: "",
    genre: "",
    price: "",
    stock: "",
    description: "",
    imageUrl: "",
    isbn13: "",
    publisher: "",
    publishedAt: "",
  });

  // Check if admin
  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      const u = raw ? JSON.parse(raw) : null;
      if (!u || u.role !== "admin") {
        toast.error("Acces refuzat. Ești admin?");
        navigate("/");
        return;
      }
      setUser(u);
    } catch {
      navigate("/");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Fetch books
  useEffect(() => {
    if (!user) return;
    fetchBooks();
  }, [user]);

  const fetchBooks = async () => {
    setBooksLoading(true);
    try {
      const res = await api.get("/books");
      const data = res.data;
      if (Array.isArray(data)) {
        setBooks(data);
      } else {
        setBooks(data.items || []);
      }
    } catch (e) {
      toast.error("Eroare la preluarea cărților");
      console.error(e);
    } finally {
      setBooksLoading(false);
    }
  };

  const resetForm = () => {
    setBookForm({
      title: "",
      author: "",
      genre: "",
      price: "",
      stock: "",
      description: "",
      imageUrl: "",
      isbn13: "",
      publisher: "",
      publishedAt: "",
    });
    setEditingBook(null);
  };

  const handleSaveBook = async (e) => {
    e.preventDefault();

    if (!bookForm.title || !bookForm.price || bookForm.stock === "") {
      toast.error("Completează câmpurile obligatorii: titlu, preț, stoc");
      return;
    }

    try {
      const payload = {
        title: bookForm.title.trim(),
        author: bookForm.author?.trim() || null,
        genre: bookForm.genre?.trim() || null,
        price: Number(bookForm.price),
        stock: Number(bookForm.stock),
        description: bookForm.description?.trim() || null,
        imageUrl: bookForm.imageUrl?.trim() || null,
        isbn13: bookForm.isbn13?.trim() || null,
        publisher: bookForm.publisher?.trim() || null,
        publishedAt: bookForm.publishedAt ? new Date(bookForm.publishedAt).toISOString() : null,
      };

      if (editingBook) {
        // Update
        await api.put(`/books/${editingBook.id}`, payload);
        toast.success("Cartea a fost actualizată!");
      } else {
        // Create
        await api.post("/books", payload);
        toast.success("Cartea a fost adăugată!");
      }

      resetForm();
      setShowAddBook(false);
      fetchBooks();
    } catch (e) {
      const msg = e?.response?.data?.mesaj || "Eroare la salvarea cărții";
      toast.error(msg);
      console.error(e);
    }
  };

  const handleEditBook = (book) => {
    setBookForm({
      title: book.title || "",
      author: book.author || "",
      genre: book.genre || "",
      price: book.price?.toString() || "",
      stock: book.stock?.toString() || "",
      description: book.description || "",
      imageUrl: book.imageUrl || "",
      isbn13: book.isbn13 || "",
      publisher: book.publisher || "",
      publishedAt: book.publishedAt ? book.publishedAt.split("T")[0] : "",
    });
    setEditingBook(book);
    setShowAddBook(true);
  };

  const handleDeleteBook = async (id) => {
    if (!window.confirm("Ești sigur că vrei să ștergi această carte?")) return;

    try {
      await api.delete(`/books/${id}`);
      toast.success("Cartea a fost ștearsă!");
      fetchBooks();
    } catch (e) {
      const msg = e?.response?.data?.mesaj || "Eroare la ștergerea cărții";
      toast.error(msg);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-slate-600">Se verifică permisiunile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 sm:p-8">
      <div className="max-w-7xl mx-auto">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <span className="text-4xl">⚙️</span> Panou Administrator
          </h1>
          <p className="text-slate-600 mt-2">Bine ai venit, {user.username}!</p>
        </div>

        <div className="bg-white rounded-xl shadow mb-8 p-4 flex gap-4 border-b-2 border-slate-200">
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium">
            📚 Gestionare Cărți
          </button>
        </div>

        <div className="bg-white rounded-xl shadow p-6">

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Cărți în catalog</h2>
            <button
              onClick={() => {
                resetForm();
                setShowAddBook(true);
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              + Adaugă carte nouă
            </button>
          </div>

          {showAddBook && (
            <div className="border border-slate-200 rounded-xl p-6 mb-6 bg-slate-50">
              <h3 className="text-lg font-bold mb-4">
                {editingBook ? "Editează cartea" : "Adaugă carte nouă"}
              </h3>

              <form onSubmit={handleSaveBook} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Titlu *
                    </label>
                    <input
                      type="text"
                      value={bookForm.title}
                      onChange={(e) =>
                        setBookForm({ ...bookForm, title: e.target.value })
                      }
                      placeholder="Ex: The Pragmatic Programmer"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Autor
                    </label>
                    <input
                      type="text"
                      value={bookForm.author}
                      onChange={(e) =>
                        setBookForm({ ...bookForm, author: e.target.value })
                      }
                      placeholder="Ex: David Thomas, Andrew Hunt"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Gen
                    </label>
                    <input
                      type="text"
                      value={bookForm.genre}
                      onChange={(e) =>
                        setBookForm({ ...bookForm, genre: e.target.value })
                      }
                      placeholder="Ex: Programare, Ficțiune"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Preț (RON) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={bookForm.price}
                      onChange={(e) =>
                        setBookForm({ ...bookForm, price: e.target.value })
                      }
                      placeholder="Ex: 49.99"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Stoc *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={bookForm.stock}
                      onChange={(e) =>
                        setBookForm({ ...bookForm, stock: e.target.value })
                      }
                      placeholder="Ex: 10"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      ISBN-13
                    </label>
                    <input
                      type="text"
                      value={bookForm.isbn13}
                      onChange={(e) =>
                        setBookForm({ ...bookForm, isbn13: e.target.value })
                      }
                      placeholder="Ex: 978-0201634793"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Editor
                    </label>
                    <input
                      type="text"
                      value={bookForm.publisher}
                      onChange={(e) =>
                        setBookForm({ ...bookForm, publisher: e.target.value })
                      }
                      placeholder="Ex: Addison-Wesley"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Data publicării
                    </label>
                    <input
                      type="date"
                      value={bookForm.publishedAt}
                      onChange={(e) =>
                        setBookForm({ ...bookForm, publishedAt: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Descriere
                  </label>
                  <textarea
                    value={bookForm.description}
                    onChange={(e) =>
                      setBookForm({ ...bookForm, description: e.target.value })
                    }
                    placeholder="Ex: O ghid complet pentru programe de calitate..."
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    URL imagine
                  </label>
                  <input
                    type="url"
                    value={bookForm.imageUrl}
                    onChange={(e) =>
                      setBookForm({ ...bookForm, imageUrl: e.target.value })
                    }
                    placeholder="https://..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                  >
                    {editingBook ? "Salvează modificări" : "Adaugă carte"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setShowAddBook(false);
                    }}
                    className="px-4 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 transition font-medium"
                  >
                    Anulează
                  </button>
                </div>
              </form>
            </div>
          )}

          {booksLoading ? (
            <div className="text-center py-8">
              <p className="text-slate-600">Se încarcă...</p>
            </div>
          ) : books.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-600">Nu sunt cărți în catalog.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b-2 border-slate-300">
                  <tr className="bg-slate-50">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">
                      Titlu
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">
                      Autor
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">
                      Gen
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">
                      Preț
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">
                      Stoc
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700">
                      Acțiuni
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {books.map((book) => (
                    <tr
                      key={book.id}
                      className="border-b border-slate-200 hover:bg-slate-50 transition"
                    >
                      <td className="py-3 px-4 text-slate-900 font-medium">
                        {book.title}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{book.author || "—"}</td>
                      <td className="py-3 px-4 text-slate-600">{book.genre || "—"}</td>
                      <td className="py-3 px-4 text-right text-slate-900 font-medium">
                        {typeof book.price === "object"
                          ? book.price.toFixed ? book.price.toFixed(2) : book.price
                          : Number(book.price).toFixed(2)}{" "}
                        RON
                      </td>
                      <td className={cn(
                        "py-3 px-4 text-right font-medium",
                        book.stock > 0 ? "text-green-600" : "text-rose-600"
                      )}>
                        {book.stock}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleEditBook(book)}
                          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition mr-2"
                        >
                          ✎ Editează
                        </button>
                        <button
                          onClick={() => handleDeleteBook(book.id)}
                          className="px-3 py-1 text-sm bg-rose-100 text-rose-700 rounded hover:bg-rose-200 transition"
                        >
                          🗑️ Șterge
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
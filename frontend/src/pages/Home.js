// src/pages/Home.js
import { useEffect, useMemo, useRef, useState } from "react";
import api from "../api/axios";
import BookCard from "../components/BookCard";
import { toast } from "react-toastify";


const cn = (...c) => c.filter(Boolean).join(" ");

function useDebounced(value, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}


function AuthorChips({ authors, setAuthors }) {
  const [input, setInput] = useState("");

  const add = (name) => {
    const v = name.trim();
    if (!v) return;
    if (!authors.includes(v)) setAuthors([...authors, v]);
    setInput("");
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {authors.map((a) => (
          <span
            key={a}
            className="inline-flex items-center gap-2 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 text-xs"
          >
            {a}
            <button
              onClick={() => setAuthors(authors.filter((x) => x !== a))}
              className="hover:text-indigo-900"
              aria-label={`Elimină ${a}`}
            >
              ✕
            </button>
          </span>
        ))}
        {authors.length === 0 && (
          <span className="text-xs text-slate-400">Adaugă unul sau mai mulți autori</span>
        )}
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") add(input);
          }}
          placeholder="Ex: Martin Fowler"
          className="flex-1 rounded-xl bg-white border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={() => add(input)}
          className="rounded-xl px-3 py-2 text-sm bg-indigo-600 text-white hover:bg-indigo-700"
        >
          Adaugă
        </button>
      </div>

      {authors.length > 0 && (
        <button
          onClick={() => setAuthors([])}
          className="mt-2 text-xs text-slate-500 hover:text-slate-700"
        >
          Resetează autori
        </button>
      )}
    </div>
  );
}

function SearchToolbar({
  q, setQ,
  sort, setSort,
  selectedGenres, setSelectedGenres,
  authors, setAuthors,
  priceMin, setPriceMin,
  priceMax, setPriceMax,
  inStockOnly, setInStockOnly,
  onReset,
  onEnter,
}) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const [genres, setGenres] = useState([]);
  const [loadingGenres, setLoadingGenres] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    setLoadingGenres(true);
    api.get("/genuri")
      .then((r) => setGenres(Array.isArray(r.data) ? r.data : []))
      .catch(() => setGenres([]))
      .finally(() => setLoadingGenres(false));
  }, []);

  const toggleGenre = (g) => {
    if (selectedGenres.includes(g)) {
      setSelectedGenres(selectedGenres.filter((x) => x !== g));
    } else {
      setSelectedGenres([...selectedGenres, g]);
    }
  };

  return (
    <div className="sticky top-16 z-20">
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-500 p-[1px] rounded-2xl shadow">
        <div className="bg-white/90 backdrop-blur rounded-2xl px-3 py-3 sm:px-4 sm:py-3">

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">

            <div className="relative flex-1">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400"
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              >
                <circle cx="11" cy="11" r="7"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setQ("");
                  if (e.key === "Enter") onEnter?.();
                }}
                placeholder="Caută titlu, autor, gen…"
                className="w-full pl-10 pr-16 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400"
              />
              {q && (
                <button
                  onClick={() => setQ("")}
                  aria-label="Șterge"
                  className="absolute right-10 top-1/2 -translate-y-1/2 text-lg leading-none text-slate-400 hover:text-slate-700"
                >
                  ×
                </button>
              )}
              <kbd className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 border border-slate-300 rounded bg-white/70">
                ⌘K
              </kbd>
            </div>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-xl bg-white border border-slate-300 text-slate-900 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="nou">Cele mai noi</option>
              <option value="titlu">Titlu (A–Z)</option>
              <option value="price_asc">Preț ↑</option>
              <option value="price_desc">Preț ↓</option>
            </select>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setOpen((v) => !v)}
                className={cn(
                  "rounded-xl px-3 py-2.5 text-sm border transition",
                  open
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                )}
              >
                {open ? "Ascunde filtre" : "Filtre avansate"}
              </button>

              <button
                onClick={onReset}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                Resetează
              </button>
            </div>
          </div>

          {open && (
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2 border border-slate-200 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-slate-800">Genuri</h4>
                  {loadingGenres && (
                    <span className="text-xs text-slate-400">se încarcă…</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {genres.length === 0 && !loadingGenres && (
                    <span className="text-xs text-slate-400">Nu există genuri în catalog.</span>
                  )}
                  {genres.map((g) => {
                    const active = selectedGenres.includes(g);
                    return (
                      <button
                        key={g}
                        onClick={() => toggleGenre(g)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs border transition",
                          active
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                        )}
                      >
                        {g}
                      </button>
                    );
                  })}
                </div>
                {selectedGenres.length > 0 && (
                  <button
                    onClick={() => setSelectedGenres([])}
                    className="mt-2 text-xs text-slate-500 hover:text-slate-700"
                  >
                    Resetează genuri
                  </button>
                )}
              </div>

              <div className="border border-slate-200 rounded-xl p-3">
                <h4 className="font-medium text-slate-800 mb-2">Autori</h4>
                <AuthorChips authors={authors} setAuthors={setAuthors} />
              </div>

              <div className="border border-slate-200 rounded-xl p-3">
                <h4 className="font-medium text-slate-800 mb-2">Preț</h4>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={priceMin ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        setPriceMin(v === "" ? null : Number(v));
                      }}
                      placeholder="Min"
                      className="w-24 rounded-lg bg-white border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-slate-400">—</span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={priceMax ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        setPriceMax(v === "" ? null : Number(v));
                      }}
                      placeholder="Max"
                      className="w-24 rounded-lg bg-white border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={inStockOnly}
                        onChange={(e) => setInStockOnly(e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-checked:bg-indigo-600 rounded-full relative transition">
                        <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition peer-checked:translate-x-5" />
                      </div>
                      <span className="ml-2 text-sm text-slate-700">Doar produse în stoc</span>
                    </label>
                  </div>

                  {(priceMin !== null || priceMax !== null || inStockOnly) && (
                    <button
                      onClick={() => { setPriceMin(null); setPriceMax(null); setInStockOnly(false); }}
                      className="text-xs text-slate-500 hover:text-slate-700"
                    >
                      Resetează secțiunea
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Home() {

  const [q, setQ] = useState(() => localStorage.getItem("search:q") ?? "");
  const [sort, setSort] = useState(() => localStorage.getItem("search:sort") ?? "nou");
  const [selectedGenres, setSelectedGenres] = useState(() => {
    try { return JSON.parse(localStorage.getItem("filters:genres") || "[]"); }
    catch { return []; }
  });
  const [authors, setAuthors] = useState(() => {
    try { return JSON.parse(localStorage.getItem("filters:authors") || "[]"); }
    catch { return []; }
  });
  const [priceMin, setPriceMin] = useState(() => {
    const v = localStorage.getItem("filters:priceMin");
    return v ? Number(v) : null;
  });
  const [priceMax, setPriceMax] = useState(() => {
    const v = localStorage.getItem("filters:priceMax");
    return v ? Number(v) : null;
  });
  const [inStockOnly, setInStockOnly] = useState(() => localStorage.getItem("filters:inStockOnly") === "1");

  const pageLimit = 12;
  const [page, setPage] = useState(1);

  useEffect(() => {
    try {
      localStorage.setItem("search:q", q ?? "");
      localStorage.setItem("search:sort", sort ?? "nou");
      localStorage.setItem("filters:genres", JSON.stringify(selectedGenres));
      localStorage.setItem("filters:authors", JSON.stringify(authors));
      localStorage.setItem("filters:priceMin", priceMin ?? "");
      localStorage.setItem("filters:priceMax", priceMax ?? "");
      localStorage.setItem("filters:inStockOnly", inStockOnly ? "1" : "0");
    } catch {}
  }, [q, sort, selectedGenres, authors, priceMin, priceMax, inStockOnly]);

  const dq = useDebounced(q, 300);

  const [carti, setCarti] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1, limit: pageLimit });
  const controllerRef = useRef(null);
  const gridTopRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    setErr("");
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    const params = {
      q: dq || undefined,
      sort,
      page,
      limit: pageLimit,
    };

    if (selectedGenres.length > 0) params.gen = selectedGenres.join(",");
    if (authors.length > 0) params.autor = authors.join(",");
    if (priceMin !== null) params.pretMin = priceMin;
    if (priceMax !== null) params.pretMax = priceMax;
    if (inStockOnly) params.stocMin = 1;

    (async () => {
      try {
        const res = await api.get("/carti", { params, signal: controller.signal });
        const data = res.data;
        if (Array.isArray(data)) {
          setCarti(data);
          setMeta({ total: data.length, page: 1, pages: 1, limit: pageLimit });
        } else {
          setCarti(data.items || []);
          setMeta(data.meta || { total: 0, page: 1, pages: 1, limit: pageLimit });
        }
      } catch (e) {
        if (e.name !== "CanceledError" && e.code !== "ERR_CANCELED") {
          console.error("Eroare la preluarea cărților", e);
          setErr("Nu am putut încărca lista de cărți.");
          toast.error("Nu am putut încărca lista de cărți.");
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [dq, sort, page, selectedGenres, authors, priceMin, priceMax, inStockOnly]);

  useEffect(() => {
    if (page > 1) gridTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [page]);

  const onAddToCart = (book) => {
    try {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      const idx = cart.findIndex((it) => it.id === book.id);

      if (idx === -1) {
        cart.push({
          id: book.id,
          title: book.title,
          price: book.price,
          imageUrl: book.imageUrl,
          author: book.author,
          qty: 1,
        });
        toast.success(`🛒 „${book.title}” a fost adăugată în coș.`);
      } else {
        cart[idx].qty += 1;
        toast.info(`➕ Cantitate actualizată pentru „${book.title}” (x${cart[idx].qty}).`);
      }

      localStorage.setItem("cart", JSON.stringify(cart));
      window.dispatchEvent(new Event("cart:updated"));
    } catch {
      toast.error("Nu am putut adăuga în coș. Încearcă din nou.");
    }
  };

  const resultsLabel = useMemo(() => {
    if (loading) return "Se încarcă…";
    if (err) return "Eroare";
    if (!carti.length) return "Niciun rezultat";
    const start = (meta.page - 1) * meta.limit + 1;
    const end = Math.min(meta.page * meta.limit, meta.total);
    return `${start}–${end} din ${meta.total}`;
  }, [loading, err, carti.length, meta]);

  const resetAll = () => {
    setQ("");
    setSort("nou");
    setSelectedGenres([]);
    setAuthors([]);
    setPriceMin(null);
    setPriceMax(null);
    setInStockOnly(false);
    setPage(1);
  };

  const setQAndReset = (v) => { setQ(v); setPage(1); };
  const setSortAndReset = (v) => { setSort(v); setPage(1); };
  const setGenresAndReset = (v) => { setSelectedGenres(v); setPage(1); };
  const setAuthorsAndReset = (v) => { setAuthors(v); setPage(1); };

  return (
    <div className="p-6 sm:p-8 bg-slate-50 min-h-screen">
      <div className="mb-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center gap-2">
          <span className="text-3xl">📚</span> Cărțile disponibile
        </h1>
        <div className="text-sm text-slate-600">{resultsLabel}</div>
      </div>

      <SearchToolbar
        q={q} setQ={setQAndReset}
        sort={sort} setSort={setSortAndReset}
        selectedGenres={selectedGenres} setSelectedGenres={setGenresAndReset}
        authors={authors} setAuthors={setAuthorsAndReset}
        priceMin={priceMin} setPriceMin={(v) => { setPriceMin(v); setPage(1); }}
        priceMax={priceMax} setPriceMax={(v) => { setPriceMax(v); setPage(1); }}
        inStockOnly={inStockOnly} setInStockOnly={(v) => { setInStockOnly(v); setPage(1); }}
        onReset={resetAll}
        onEnter={() => setPage(1)}
      />

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-6" ref={gridTopRef}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow overflow-hidden animate-pulse">
              <div className="h-64 bg-slate-200" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
                <div className="h-5 bg-slate-200 rounded w-1/3" />
                <div className="h-9 bg-slate-200 rounded w-full mt-2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && err && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-4 mt-6">
          {err}
        </div>
      )}

      {!loading && !err && carti.length === 0 && (
        <div className="text-center text-slate-600 py-16">
          <div className="text-5xl mb-3">🔎</div>
          <p className="text-lg font-medium">Nu am găsit cărți pentru criteriile actuale.</p>
          <p className="text-sm">Încearcă alt cuvânt-cheie sau modifică filtrele.</p>
        </div>
      )}

      {!loading && !err && carti.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-6" ref={gridTopRef}>
          {carti.map((book) => (
            <BookCard key={book.id} book={book} onAdd={onAddToCart} />
          ))}
        </div>
      )}

      {!loading && !err && meta.pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={meta.page <= 1}
            className="px-4 py-2 rounded-lg border border-slate-300 bg-white disabled:opacity-50"
          >
            ◀ Precedent
          </button>

          <div className="flex gap-1">
            {Array.from({ length: meta.pages }).map((_, i) => {
              const p = i + 1;
              const active = p === meta.page;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    "w-9 h-9 rounded-lg border text-sm transition",
                    active
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                  )}
                >
                  {p}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setPage((p) => Math.min(meta.pages, p + 1))}
            disabled={meta.page >= meta.pages}
            className="px-4 py-2 rounded-lg border border-slate-300 bg-white disabled:opacity-50"
          >
            Următor ▶
          </button>
        </div>
      )}
    </div>
  );
}

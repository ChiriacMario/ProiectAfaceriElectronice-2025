// src/pages/Cart.js
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function Cart() {
  const [cart, setCart] = useState([]);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [payMethod, setPayMethod] = useState("COD"); 
  const [err, setErr] = useState("");

  const [addresses, setAddresses] = useState([]);
  const [addrMode, setAddrMode] = useState("saved");
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  const [m, setM] = useState({
    recipient: "",
    line1: "",
    line2: "",
    city: "",
    region: "",
    postalCode: "",
    country: "RO",
    phone: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("cart") || "[]");
      const norm = saved.map((it) => ({
        ...it,
        price: Number(it.price),
        qty: Number(it.qty || 1),
      }));
      setCart(norm);
    } catch {
      setCart([]);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    (async () => {
      try {
        const r = await api.get("/adrese", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAddresses(Array.isArray(r.data) ? r.data : []);

        const def = (r.data || []).find((a) => a.isDefault);
        if (def) setSelectedAddressId(def.id);
        else if (r.data?.length) setSelectedAddressId(r.data[0].id);
      } catch {
        setAddresses([]);
      }
    })();
  }, []);

  const updateCart = (newCart) => {
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
    window.dispatchEvent(new Event("cart:updated"));
  };

  const updateQty = (id, delta) => {
    const updated = cart
      .map((item) => {
        if (item.id !== id) return item;
        const next = Math.max(0, (item.qty || 1) + delta);
        return { ...item, qty: next };
      })
      .filter((i) => i.qty > 0);
    updateCart(updated);
  };

  const removeItem = (id) => updateCart(cart.filter((i) => i.id !== id));
  const clearCart = () => updateCart([]);

  const total = useMemo(
    () => cart.reduce((s, it) => s + Number(it.price) * Number(it.qty || 1), 0),
    [cart]
  );

  const token = localStorage.getItem("token");

  const addressValid =
    addrMode === "saved"
      ? !!selectedAddressId
      : m.line1.trim().length > 0 && m.city.trim().length > 0;

  const placeOrder = async () => {
    setErr("");
    if (!token) return navigate("/login");
    if (cart.length === 0) return;
    if (!addressValid) {
      setErr("Completează sau selectează o adresă de livrare.");
      return;
    }

    setLoadingOrder(true);
    try {
      const items = cart.map((it) => ({
        bookId: Number(it.id),
        quantity: Number(it.qty || 1),
      }));

      const addressPayload =
        addrMode === "saved"
          ? { shippingAddressId: Number(selectedAddressId) }
          : {
              shipping: {
                recipient: m.recipient?.trim() || JSON.parse(localStorage.getItem("user") || "{}")?.username || "",
                line1: m.line1.trim(),
                line2: m.line2?.trim() || null,
                city: m.city.trim(),
                region: m.region?.trim() || null,
                postalCode: m.postalCode?.trim() || null,
                country: m.country?.trim() || "RO",
                phone: m.phone?.trim() || null,
              },
            };

      await api.post(
        "/checkout",
        { items, paymentMethod: payMethod, ...addressPayload },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      clearCart();
      alert("Comanda a fost plasată cu succes!");
      navigate("/");
    } catch (e) {
      const msg =
        e?.response?.data?.mesaj ||
        "A apărut o eroare la plasarea comenzii.";
      setErr(msg);
      alert(msg);
    } finally {
      setLoadingOrder(false);
    }
  };

  if (cart.length === 0)
    return (
      <div className="p-8 min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-2xl font-semibold text-slate-700 mb-2">
          Coșul tău este gol
        </h2>
        <p className="text-slate-500 mb-6">
          Adaugă produse în coș pentru a continua.
        </p>
        <Link
          to="/"
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
        >
          Continuă cumpărăturile
        </Link>
      </div>
    );

  return (
    <div className="p-6 sm:p-10 bg-slate-50 min-h-screen">
      <h1 className="text-3xl font-bold text-slate-800 mb-8">🛒 Coș de cumpărături</h1>

      {err && (
        <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3">
          {err}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">

        <div className="lg:col-span-2 space-y-6">
          {cart.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow p-4 flex gap-4 items-center">
              <img
                src={item.imageUrl || "https://via.placeholder.com/120"}
                className="w-24 h-32 object-cover rounded-lg"
                alt={item.title}
              />
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-slate-800">{item.title}</h2>
                <p className="text-sm text-slate-500">{item.author}</p>
                <p className="text-indigo-600 font-bold mt-1">
                  {Number(item.price).toLocaleString("ro-RO", { minimumFractionDigits: 2 })} RON
                </p>

                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => updateQty(item.id, -1)}
                    className="w-8 h-8 bg-slate-200 hover:bg-slate-300 rounded-full flex items-center justify-center"
                  >
                    –
                  </button>
                  <span className="px-3">{item.qty}</span>
                  <button
                    onClick={() => updateQty(item.id, +1)}
                    className="w-8 h-8 bg-slate-200 hover:bg-slate-300 rounded-full flex items-center justify-center"
                  >
                    +
                  </button>

                  <button
                    onClick={() => removeItem(item.id)}
                    className="ml-4 text-rose-600 hover:text-rose-700 text-sm"
                  >
                    Șterge
                  </button>
                </div>
              </div>

              <div className="text-right font-semibold text-slate-700">
                {(Number(item.price) * Number(item.qty || 1)).toLocaleString("ro-RO", {
                  minimumFractionDigits: 2,
                })}{" "}
                RON
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between">
            <button onClick={clearCart} className="text-sm text-slate-500 hover:text-slate-700">
              Golește coșul
            </button>
          </div>
        </div>

        <div className="space-y-6">

          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold text-slate-800">Adresă de livrare</h2>

            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setAddrMode("saved")}
                className={`px-3 py-1.5 rounded-lg border text-sm ${
                  addrMode === "saved"
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white border-slate-300 text-slate-700"
                }`}
              >
                Adresă salvată
              </button>
              <button
                onClick={() => setAddrMode("manual")}
                className={`px-3 py-1.5 rounded-lg border text-sm ${
                  addrMode === "manual"
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white border-slate-300 text-slate-700"
                }`}
              >
                Introdu manual
              </button>
            </div>

            {addrMode === "saved" && (
              <div className="mt-4 space-y-2">
                {token ? (
                  addresses.length ? (
                    addresses.map((a) => (
                      <label
                        key={a.id}
                        className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50"
                      >
                        <input
                          type="radio"
                          name="addr"
                          className="mt-1"
                          checked={selectedAddressId === a.id}
                          onChange={() => setSelectedAddressId(a.id)}
                        />
                        <div className="text-sm text-slate-700">
                          <div className="font-medium">
                            {a.label || "Adresă"} {a.isDefault ? "• implicită" : ""}
                          </div>
                          <div>
                            {a.line1}
                            {a.line2 ? `, ${a.line2}` : ""}
                          </div>
                          <div>
                            {a.city}
                            {a.region ? `, ${a.region}` : ""} {a.postalCode ? `, ${a.postalCode}` : ""}
                          </div>
                          <div>{a.country || "RO"}</div>
                        </div>
                      </label>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">
                      Nu ai adrese salvate. Poți completa manual mai jos sau adăuga din profil.
                    </p>
                  )
                ) : (
                  <p className="text-sm text-slate-500">
                    Trebuie să fii autentificat pentru a folosi adrese salvate.
                  </p>
                )}
              </div>
            )}

            {addrMode === "manual" && (
              <div className="mt-4 space-y-3">
                <input
                  placeholder="Destinatar (opțional)"
                  value={m.recipient}
                  onChange={(e) => setM({ ...m, recipient: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  placeholder="Stradă, număr, apartament *"
                  value={m.line1}
                  onChange={(e) => setM({ ...m, line1: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  placeholder="Detalii adresă (opțional)"
                  value={m.line2}
                  onChange={(e) => setM({ ...m, line2: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    placeholder="Localitate *"
                    value={m.city}
                    onChange={(e) => setM({ ...m, city: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                  <input
                    placeholder="Județ / Regiune"
                    value={m.region}
                    onChange={(e) => setM({ ...m, region: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    placeholder="Cod poștal"
                    value={m.postalCode}
                    onChange={(e) => setM({ ...m, postalCode: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                  <input
                    placeholder="Țară"
                    value={m.country}
                    onChange={(e) => setM({ ...m, country: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <input
                  placeholder="Telefon (opțional)"
                  value={m.phone}
                  onChange={(e) => setM({ ...m, phone: e.target.value.replace(/[^\d+ ]/g, "") })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <p className="text-xs text-slate-500">Câmpurile marcate cu * sunt obligatorii.</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow p-6 h-fit">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Sumar comandă</h2>

            <div className="flex justify-between mb-2 text-slate-600">
              <span>Produse</span>
              <span>{cart.length}</span>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Metoda de plată
              </label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="COD">Ramburs (COD)</option>
                <option value="CARD">Card</option>
                <option value="TRANSFER">Transfer bancar</option>
              </select>
            </div>

            <div className="flex justify-between text-lg font-bold text-slate-800 mt-6 mb-6">
              <span>Total</span>
              <span>{total.toLocaleString("ro-RO", { minimumFractionDigits: 2 })} RON</span>
            </div>

            <button
              onClick={placeOrder}
              disabled={loadingOrder}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg transition disabled:bg-indigo-300"
            >
              {loadingOrder ? "Se plasează..." : "Plasează comanda"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

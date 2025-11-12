// src/pages/Profile.js
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { toast } from "react-toastify";

function ConfirmDialog({
  open,
  title = "Ești sigur?",
  message = "Această acțiune este ireversibilă.",
  confirmText = "Confirmă",
  cancelText = "Anulează",
  onConfirm,
  onClose,
  children,
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-slate-200">
          <div className="p-5">
            <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
            <p className="text-sm text-slate-600 mt-1">{message}</p>
            {children && <div className="mt-4">{children}</div>}
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700"
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [openOrderId, setOpenOrderId] = useState(null);

  const [addresses, setAddresses] = useState([]);
  const [addrForm, setAddrForm] = useState({
    id: null,
    label: "",
    line1: "",
    line2: "",
    city: "",
    region: "",
    postalCode: "",
    country: "RO",
    isDefault: false,
  });
  const [addrSaving, setAddrSaving] = useState(false);
  const [addrErr, setAddrErr] = useState("");

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [fUser, setFUser] = useState({ username: "", email: "" });
  const [fPass, setFPass] = useState({ currentPassword: "", newPassword: "", confirm: "" });

  const [deletePass, setDeletePass] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const token = useMemo(() => localStorage.getItem("token"), []);
  const authHdr = { headers: { Authorization: `Bearer ${token}` } };

  const fmtRON = (n) =>
    Number(n ?? 0).toLocaleString("ro-RO", { minimumFractionDigits: 2 }) + " RON";
  const fmtDate = (d) => (d ? new Date(d).toLocaleString("ro-RO") : "");

  const forceReauth = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("auth:changed"));
    navigate("/login");
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    setLoading(true);
    setErr("");

    Promise.all([
      api.get("/profil", authHdr),
      api.get("/adrese", authHdr).catch(() => ({ data: [] })),
    ])
      .then(([p, a]) => {
        const u = p?.data?.user;
        const o = p?.data?.orders ?? [];
        if (!u) {
          setErr("Nu am putut încărca profilul.");
          return;
        }
        setProfile(u);
        setOrders(o);
        setAddresses(a?.data ?? []);
        setFUser({ username: u.username || "", email: u.email || "" });

        localStorage.setItem(
          "user",
          JSON.stringify({ id: u.id, username: u.username, email: u.email, role: u.role || "client" })
        );
        window.dispatchEvent(new Event("auth:changed"));
      })
      .catch((e) => {
        console.error(e);
        if (e?.response?.status === 401) forceReauth();
        else setErr("Nu am putut încărca profilul.");
      })
      .finally(() => setLoading(false));
  }, [token, navigate]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (fPass.newPassword || fPass.currentPassword || fPass.confirm) {
      if (!fPass.currentPassword || !fPass.newPassword) {
        toast.error("Completează atât parola curentă cât și noua parolă.");
        return;
      }
      if (fPass.newPassword.length < 6) {
        toast.error("Parola nouă trebuie să aibă minim 6 caractere.");
        return;
      }
      if (fPass.newPassword !== fPass.confirm) {
        toast.error("Confirmarea parolei nu se potrivește.");
        return;
      }
    }

    try {
      const payload = {
        username: fUser.username.trim(),
        email: fUser.email.trim(),
        currentPassword: fPass.currentPassword || undefined,
        newPassword: fPass.newPassword || undefined,
      };
      const { data } = await api.put("/profil", payload, authHdr);
      if (data?.user) {
        setProfile((p) => ({ ...p, ...data.user }));
        localStorage.setItem("user", JSON.stringify(data.user));
        window.dispatchEvent(new Event("auth:changed"));
      }
      setFPass({ currentPassword: "", newPassword: "", confirm: "" });
      toast.success("Profil actualizat cu succes.");
    } catch (e) {
      console.error(e);
      if (e?.response?.status === 409) {
        toast.error(e.response.data?.mesaj || "Email/username deja folosit.");
      } else if (e?.response?.status === 401) {
        toast.error("Parola curentă este incorectă.");
      } else {
        toast.error("Eroare la actualizarea profilului.");
      }
    }
  };

  const resetAddrForm = () =>
    setAddrForm({
      id: null,
      label: "",
      line1: "",
      line2: "",
      city: "",
      region: "",
      postalCode: "",
      country: "RO",
      isDefault: false,
    });

  const startEditAddr = (a) =>
    setAddrForm({
      id: a.id,
      label: a.label || "",
      line1: a.line1 || "",
      line2: a.line2 || "",
      city: a.city || "",
      region: a.region || "",
      postalCode: a.postalCode || "",
      country: a.country || "RO",
      isDefault: !!a.isDefault,
    });

  const reloadAddresses = async () => {
    const r = await api.get("/adrese", authHdr);
    setAddresses(r.data || []);
  };

  const saveAddress = async (e) => {
    e.preventDefault();
    setAddrErr("");
    if (!addrForm.line1.trim() || !addrForm.city.trim()) {
      setAddrErr("Câmpurile marcate cu * sunt obligatorii.");
      return;
    }
    setAddrSaving(true);
    try {
      if (addrForm.id) {
        await api.put(`/adrese/${addrForm.id}`, {
          label: addrForm.label || null,
          line1: addrForm.line1,
          line2: addrForm.line2 || null,
          city: addrForm.city,
          region: addrForm.region || null,
          postalCode: addrForm.postalCode || null,
          country: addrForm.country || "RO",
          isDefault: !!addrForm.isDefault,
        }, authHdr);
      } else {
        await api.post("/adrese", {
          label: addrForm.label || null,
          line1: addrForm.line1,
          line2: addrForm.line2 || null,
          city: addrForm.city,
          region: addrForm.region || null,
          postalCode: addrForm.postalCode || null,
          country: addrForm.country || "RO",
          isDefault: !!addrForm.isDefault,
        }, authHdr);
      }
      await reloadAddresses();
      resetAddrForm();
      toast.success("Adresa a fost salvată.");
    } catch (e) {
      console.error(e);
      toast.error("Nu am putut salva adresa.");
    } finally {
      setAddrSaving(false);
    }
  };

  const setDefaultAddr = async (id) => {
    try {
      await api.post(`/adrese/${id}/implicit`, {}, authHdr);
      await reloadAddresses();
      toast.success("Adresă setată ca implicită.");
    } catch {
      toast.error("Nu am putut seta adresa implicită.");
    }
  };

  const deleteAddr = async (id) => {
    try {
      await api.delete(`/adrese/${id}`, authHdr);
      await reloadAddresses();
      toast.success("Adresa a fost ștearsă.");
      if (addrForm.id === id) resetAddrForm();
    } catch {
      toast.error("Nu am putut șterge adresa.");
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePass) {
      toast.error("Introdu parola curentă pentru confirmare.");
      return;
    }
    setDeleting(true);
    try {
      await api.delete("/cont", { ...authHdr, data: { currentPassword: deletePass } });
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.dispatchEvent(new Event("auth:changed"));
      setDeleteOpen(false);
      toast.success("Contul a fost șters.");
      navigate("/");
    } catch (e) {
      console.error(e);
      if (e?.response?.status === 401) toast.error("Parola introdusă este incorectă.");
      else toast.error("Nu am putut șterge contul.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 sm:p-10 bg-slate-50 min-h-screen">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="bg-white rounded-2xl shadow p-6 flex items-center gap-4 animate-pulse">
            <div className="w-16 h-16 rounded-full bg-slate-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="h-3 bg-slate-200 rounded w-1/4" />
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow p-6 animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-1/5 mb-4" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-24 bg-slate-200 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (err) {
    return (
      <div className="p-6 sm:p-10 bg-slate-50 min-h-screen">
        <div className="max-w-3xl mx-auto">
          <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-4">{err}</div>
          <div className="mt-4">
            <Link to="/" className="text-indigo-600 hover:underline">← Înapoi la acasă</Link>
          </div>
        </div>
      </div>
    );
  }

  const initials = (profile?.username || "?")
    .split(" ")
    .map((p) => p[0]?.toUpperCase())
    .slice(0, 2)
    .join("");

  return (
    <div className="p-6 sm:p-10 bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="bg-white rounded-2xl shadow p-6 flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xl font-semibold">
              {initials}
            </div>
            {profile?.role && (
              <span className="absolute -bottom-1 -right-1 text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-white">
                {profile.role}
              </span>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-800">{profile?.username}</h1>
            <p className="text-slate-600">{profile?.email}</p>
            <p className="text-xs text-slate-400 mt-1">Cont creat: {fmtDate(profile?.createdAt)}</p>
          </div>
          <Link to="/" className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50">
            Continuă cumpărăturile
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Detalii cont</h2>

          <form onSubmit={handleSaveProfile} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-600 mb-1">Username</label>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                value={fUser.username}
                onChange={(e) => setFUser((s) => ({ ...s, username: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Email</label>
              <input
                type="email"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                value={fUser.email}
                onChange={(e) => setFUser((s) => ({ ...s, email: e.target.value }))}
                required
              />
            </div>

            <div className="sm:col-span-2 mt-4">
              <div className="text-sm font-medium text-slate-700 mb-2">Schimbă parola (opțional)</div>
              <div className="grid sm:grid-cols-3 gap-4">
                <input
                  type="password"
                  placeholder="Parola curentă"
                  className="rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                  value={fPass.currentPassword}
                  onChange={(e) => setFPass((s) => ({ ...s, currentPassword: e.target.value }))}
                />
                <input
                  type="password"
                  placeholder="Parolă nouă"
                  className="rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                  value={fPass.newPassword}
                  onChange={(e) => setFPass((s) => ({ ...s, newPassword: e.target.value }))}
                />
                <input
                  type="password"
                  placeholder="Confirmă parola nouă"
                  className="rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                  value={fPass.confirm}
                  onChange={(e) => setFPass((s) => ({ ...s, confirm: e.target.value }))}
                />
              </div>
            </div>

            <div className="sm:col-span-2 flex gap-2 mt-4">
              <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">
                Salvează modificările
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  setFUser({ username: profile?.username || "", email: profile?.email || "" });
                  setFPass({ currentPassword: "", newPassword: "", confirm: "" });
                }}
              >
                Resetează formularul
              </button>
            </div>
          </form>
        </div>


        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Adresele mele</h2>

          {addresses.length === 0 ? (
            <p className="text-sm text-slate-600 mb-4">Nu ai încă adrese salvate.</p>
          ) : (
            <div className="space-y-3 mb-6">
              {addresses
                .slice()
                .sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0))
                .map((a) => (
                  <div
                    key={a.id}
                    className="border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="text-sm">
                      <div className="font-medium text-slate-800">
                        {a.label || "Adresă"} {a.isDefault && <span className="ml-2 text-xs px-2 py-0.5 rounded bg-slate-100">implicită</span>}
                      </div>
                      <div className="text-slate-600">
                        {a.line1}
                        {a.line2 ? `, ${a.line2}` : ""}, {a.city}
                        {a.region ? `, ${a.region}` : ""} {a.postalCode ? `, ${a.postalCode}` : ""} • {a.country}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!a.isDefault && (
                        <button
                          onClick={() => setDefaultAddr(a.id)}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-sm"
                        >
                          Setează implicită
                        </button>
                      )}
                      <button
                        onClick={() => startEditAddr(a)}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-sm"
                      >
                        Editează
                      </button>
                      <button
                        onClick={() => deleteAddr(a.id)}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 text-sm"
                      >
                        Șterge
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}

          <form onSubmit={saveAddress} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              placeholder="Etichetă (ex: Acasă, Birou)"
              value={addrForm.label}
              onChange={(e) => setAddrForm({ ...addrForm, label: e.target.value })}
              className="border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 sm:col-span-2"
            />
            <input
              placeholder="Stradă și număr *"
              value={addrForm.line1}
              onChange={(e) => setAddrForm({ ...addrForm, line1: e.target.value })}
              className="border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 sm:col-span-2"
              required
            />
            <input
              placeholder="Bloc/Scară/Apartament"
              value={addrForm.line2}
              onChange={(e) => setAddrForm({ ...addrForm, line2: e.target.value })}
              className="border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 sm:col-span-2"
            />
            <input
              placeholder="Oraș *"
              value={addrForm.city}
              onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })}
              className="border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
              required
            />
            <input
              placeholder="Județ/Regiune"
              value={addrForm.region}
              onChange={(e) => setAddrForm({ ...addrForm, region: e.target.value })}
              className="border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
            />
            <input
              placeholder="Cod poștal"
              value={addrForm.postalCode}
              onChange={(e) => setAddrForm({ ...addrForm, postalCode: e.target.value })}
              className="border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
            />
            <input
              placeholder="Țară"
              value={addrForm.country}
              onChange={(e) => setAddrForm({ ...addrForm, country: e.target.value })}
              className="border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
            />

            <label className="flex items-center gap-2 text-sm text-slate-600 sm:col-span-2 mt-1">
              <input
                type="checkbox"
                checked={addrForm.isDefault}
                onChange={(e) => setAddrForm({ ...addrForm, isDefault: e.target.checked })}
              />
              Setează această adresă ca implicită
            </label>

            {addrErr && (
              <div className="sm:col-span-2 text-sm text-rose-600 -mt-1">{addrErr}</div>
            )}

            <div className="sm:col-span-2 flex gap-2 mt-1">
              <button
                type="submit"
                disabled={addrSaving}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-300"
              >
                {addrForm.id ? (addrSaving ? "Se salvează…" : "Salvează adresa") : (addrSaving ? "Se adaugă…" : "Adaugă adresă")}
              </button>
              {addrForm.id && (
                <button
                  type="button"
                  onClick={resetAddrForm}
                  className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                >
                  Renunță la editare
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Istoric comenzi</h2>
            <span className="text-sm text-slate-500">
              {orders.length} comandă{orders.length === 1 ? "" : "ri"}
            </span>
          </div>

          {orders.length === 0 ? (
            <div className="text-center text-slate-600 py-10">
              <div className="text-5xl mb-2">🧾</div>
              <p className="font-medium">Încă nu ai comenzi.</p>
              <p className="text-sm">Descoperă titluri noi și plasează prima comandă.</p>
              <Link to="/" className="inline-block mt-4 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">
                Vezi cărțile
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {orders.map((o) => {
                const isOpen = openOrderId === o.id;
                return (
                  <div key={o.id} className="rounded-xl border border-slate-200">
                    <button
                      onClick={() => setOpenOrderId(isOpen ? null : o.id)}
                      className="w-full text-left p-4 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-slate-800">Comanda #{o.id}</div>
                        <div className="text-xs text-slate-500">{fmtDate(o.createdAt)}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {o.status || "plasata"}
                        </span>
                        <span className="text-slate-400">{isOpen ? "▴" : "▾"}</span>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-4">
                        <div className="space-y-2">
                          {(o.items || []).map((it) => (
                            <div key={it.id} className="flex items-start justify-between gap-3">
                              <div className="text-sm text-slate-700">
                                {it.book?.title || `Carte #${it.bookId}`}{" "}
                                <span className="text-slate-500">× {it.quantity}</span>
                              </div>
                              <div className="text-sm font-medium text-slate-800">
                                {fmtRON(it.subtotal)}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
                          <div className="text-sm text-slate-600">Total</div>
                          <div className="font-semibold text-slate-800">{fmtRON(o.total)}</div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow p-6 border border-rose-200/60">
          <h2 className="text-lg font-semibold text-rose-700 mb-2">Ștergere cont</h2>
          <p className="text-sm text-rose-600 mb-4">
            Acțiune ireversibilă — toate comenzile și datele asociate vor fi eliminate.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <div className="grow basis-64">
              <input
                type="password"
                placeholder="Confirmă cu parola curentă"
                className="w-full rounded-lg border border-rose-300 px-3 py-2 focus:ring-2 focus:ring-rose-500"
                value={deletePass}
                onChange={(e) => setDeletePass(e.target.value)}
              />
            </div>

            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="shrink-0 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 w-full sm:w-auto"
            >
              Șterge contul
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="Confirmi ștergerea contului?"
        message="Această acțiune este permanentă. Nu vei mai putea recupera datele."
        confirmText={deleting ? "Se șterge…" : "Șterge contul"}
        cancelText="Anulează"
        onClose={() => !deleting && setDeleteOpen(false)}
        onConfirm={() => !deleting && handleDeleteAccount()}
      >
        <div className="text-sm text-slate-600">
          Parola introdusă: <span className="font-medium">{deletePass ? "●●●●●●" : "(necompletată)"}</span>
        </div>
      </ConfirmDialog>
    </div>
  );
}

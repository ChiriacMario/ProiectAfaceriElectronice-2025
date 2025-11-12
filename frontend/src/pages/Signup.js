import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
    confirm: "",
    accept: false,
  });

  const [addr, setAddr] = useState({
    label: "",
    line1: "",
    line2: "",
    city: "",
    region: "",
    postalCode: "",
    country: "RO",
    isDefault: true,
  });

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setA = (k, v) => setAddr((a) => ({ ...a, [k]: v }));

  const userOk = form.username.length >= 3;
  const firstOk = form.firstName.length >= 2;
  const lastOk = form.lastName.length >= 2;
  const emailOk = /^\S+@\S+\.\S+$/.test(form.email);
  const passOk = form.password.length >= 6;
  const matchOk = form.password === form.confirm;

  const hasAddress = () => form.address && form.line1 && form.city;
  const canSubmit =
    userOk && firstOk && lastOk && emailOk && passOk && matchOk && form.accept && !loading;

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setErr("");

    try {
      
      await api.post("/auth/register", {
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone?.trim() || null,
      });

      const login = await api.post("/auth/login", {
        email: form.email.trim(),
        password: form.password,
      });

      const { token, user } = login.data || {};
      if (!token) {
        setErr("Nu am putut obține token după înregistrare.");
        return;
      }

      localStorage.setItem("token", token);
      if (user) localStorage.setItem("user", JSON.stringify(user));

      api.defaults.headers.common.Authorization = `Bearer ${token}`;

      window.dispatchEvent(new Event("auth:changed"));

      if (token && addr.line1 && addr.city) {
        try {
          await api.post("/addresses", {
            label: addr.label?.trim() || null,
            line1: addr.line1.trim(),
            line2: addr.line2?.trim() || null,
            city: addr.city.trim(),
            region: addr.region?.trim() || null,
            postalCode: addr.postalCode?.trim() || null,
            country: addr.country?.trim() || "RO",
            isDefault: !!addr.isDefault,
          });
        } catch (addrErr) {
          console.warn("Adresa nu s-a putut salva, dar contul e creat:", addrErr);
        }
      }

      navigate("/");
    } catch (e) {
      const apiMsg = e?.response?.data?.mesaj || "A apărut o eroare. Încearcă din nou.";
      setErr(apiMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl">
        <div className="rounded-[20px] border border-slate-200 bg-white/90 backdrop-blur shadow-xl">
          <div className="px-6 py-7 sm:px-10 sm:py-10">
            <div className="mb-6 text-center">
              <div className="text-4xl mb-2">📚</div>
              <h1 className="text-2xl font-bold text-slate-900">Creează un cont</h1>
              <p className="text-sm text-slate-500">Alătură-te BookLoft.</p>
            </div>

            {err && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {err}
              </div>
            )}

            <form onSubmit={submit} className="space-y-6">

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Nume utilizator</label>
                  <input
                    value={form.username}
                    onChange={(e) => set("username", e.target.value)}
                    placeholder="ex: booklover99"
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {!userOk && form.username && (
                    <p className="mt-1 text-xs text-rose-600">Minim 3 caractere.</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Prenume</label>
                    <input
                      value={form.firstName}
                      onChange={(e) => set("firstName", e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {!firstOk && form.firstName && (
                      <p className="mt-1 text-xs text-rose-600">Minim 2 caractere.</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Nume</label>
                    <input
                      value={form.lastName}
                      onChange={(e) => set("lastName", e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {!lastOk && form.lastName && (
                      <p className="mt-1 text-xs text-rose-600">Minim 2 caractere.</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Telefon (opțional)</label>
                  <input
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value.replace(/[^\d+ ]/g, ""))}
                    placeholder="+40 7xx xxx xxx"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="tu@exemplu.ro"
                    className={`mt-1 w-full rounded-xl border px-3 py-2.5 focus:outline-none ${
                      form.email
                        ? emailOk
                          ? "border-slate-300 focus:ring-2 focus:ring-indigo-500"
                          : "border-rose-300 focus:ring-2 focus:ring-rose-400"
                        : "border-slate-300 focus:ring-2 focus:ring-indigo-500"
                    }`}
                  />
                  {form.email && !emailOk && (
                    <p className="mt-1 text-xs text-rose-600">Introduce un email valid.</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Parolă</label>
                  <div className="mt-1 relative">
                    <input
                      type={showPass ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => set("password", e.target.value)}
                      placeholder="min. 6 caractere"
                      className={`w-full rounded-xl border px-3 py-2.5 pr-10 focus:outline-none ${
                        form.password && !passOk
                          ? "border-rose-300 focus:ring-2 focus:ring-rose-400"
                          : "border-slate-300 focus:ring-2 focus:ring-indigo-500"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                      aria-label="Arată/ascunde parola"
                    >
                      {showPass ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Confirmă parola</label>
                  <div className="mt-1 relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={form.confirm}
                      onChange={(e) => set("confirm", e.target.value)}
                      className={`w-full rounded-xl border px-3 py-2.5 pr-10 focus:outline-none ${
                        form.confirm && !matchOk
                          ? "border-rose-300 focus:ring-2 focus:ring-rose-400"
                          : "border-slate-300 focus:ring-2 focus:ring-indigo-500"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                      aria-label="Arată/ascunde confirmarea"
                    >
                      {showConfirm ? "🙈" : "👁️"}
                    </button>
                  </div>
                  {form.confirm && !matchOk && (
                    <p className="mt-1 text-xs text-rose-600">Parolele nu coincid.</p>
                  )}
                </div>
              </div>

              <div className="space-y-4 border-t border-slate-200 pt-6">
                <h3 className="font-semibold text-slate-800">Adresă (opțional)</h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Etichetă</label>
                    <input
                      value={addr.label}
                      onChange={(e) => setA("label", e.target.value)}
                      placeholder="Acasă / Birou"
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Adresă</label>
                  <input
                    value={addr.line1}
                    onChange={(e) => setA("line1", e.target.value)}
                    placeholder="Str. Exemplu 10"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Adresă (linie 2)</label>
                  <input
                    value={addr.line2}
                    onChange={(e) => setA("line2", e.target.value)}
                    placeholder="Bloc, sc., ap. (opțional)"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Localitate</label>
                    <input
                      value={addr.city}
                      onChange={(e) => setA("city", e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Județ/Regiune</label>
                    <input
                      value={addr.region}
                      onChange={(e) => setA("region", e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Cod poștal</label>
                    <input
                      value={addr.postalCode}
                      onChange={(e) => setA("postalCode", e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Țara</label>
                    <input
                      value={addr.country}
                      onChange={(e) => setA("country", e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <label className="flex items-center gap-2 mt-6 select-none text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={addr.isDefault}
                      onChange={(e) => setA("isDefault", e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    Setează ca adresă implicită
                  </label>
                </div>

                {(!addr.line1 || !addr.city) && (addr.line1 || addr.city) && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    Pentru a salva adresa la creare de cont, completează cel puțin „Adresă" și „Localitate".
                  </p>
                )}
              </div>

              <label className="flex items-center gap-2 select-none text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={form.accept}
                  onChange={(e) => set("accept", e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Accept <span className="underline underline-offset-2">termenii și condițiile</span>.
              </label>

              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full rounded-xl bg-indigo-600 text-white py-2.5 font-medium hover:bg-indigo-700 disabled:bg-indigo-300 transition"
              >
                {loading ? "Se creează contul…" : "Creează cont"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              Ai deja cont?{" "}
              <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
                Autentifică-te
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
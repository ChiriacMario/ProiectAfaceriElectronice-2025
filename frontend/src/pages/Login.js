import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const emailOk = /^\S+@\S+\.\S+$/.test(email);
  const passOk = password.length >= 6;
  const canSubmit = emailOk && passOk && !loading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setErr("");

    try {
      const res = await api.post("/auth/login", { email: email.trim(), password });
      const { token, user, mesaj } = res.data || {};

      if (!token) {
        setErr(mesaj || "Răspuns invalid de la server.");
        return;
      }

      if (remember) {
        localStorage.setItem("token", token);
        if (user) localStorage.setItem("user", JSON.stringify(user));
      } else {
        sessionStorage.setItem("token", token);
        if (user) sessionStorage.setItem("user", JSON.stringify(user));
      }

      api.defaults.headers.common.Authorization = `Bearer ${token}`;

      window.dispatchEvent(new Event("auth:changed"));

      navigate("/");
    } catch (e) {
      const apiMsg = e?.response?.data?.mesaj || "Eroare la autentificare.";
      setErr(apiMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-6 sm:px-8 sm:py-8">
            <div className="mb-6 text-center">
              <div className="text-4xl mb-2">🔐</div>
              <h1 className="text-2xl font-bold text-slate-900">Autentificare</h1>
              <p className="text-sm text-slate-500">Intră în contul tău BookLoft.</p>
            </div>

            {err && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {err}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@exemplu.ro"
                  className={`mt-1 w-full rounded-xl border px-3 py-2.5 focus:outline-none
                    ${email
                      ? emailOk
                        ? "border-slate-300 focus:ring-2 focus:ring-indigo-500"
                        : "border-rose-300 focus:ring-2 focus:ring-rose-400"
                      : "border-slate-300 focus:ring-2 focus:ring-indigo-500"
                    }`}
                />
                {email && !emailOk && (
                  <p className="mt-1 text-xs text-rose-600">Introduce un email valid.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Parolă</label>
                <div className="mt-1 relative">
                  <input
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="min. 6 caractere"
                    className={`w-full rounded-xl border px-3 py-2.5 pr-10 focus:outline-none
                      ${password && !passOk
                        ? "border-rose-300 focus:ring-2 focus:ring-rose-400"
                        : "border-slate-300 focus:ring-2 focus:ring-indigo-500"
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                    aria-label="Arată/ascunde parola"
                  >
                    {show ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Ține-mă minte
                </label>
                <Link to="/reset" className="text-sm text-indigo-600 hover:text-indigo-700">
                  Ai uitat parola?
                </Link>
              </div>

              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full rounded-xl bg-indigo-600 text-white py-2.5 font-medium
                           hover:bg-indigo-700 disabled:bg-indigo-300 transition"
              >
                {loading ? "Se conectează…" : "Conectează-te"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              Nu ai cont?{" "}
              <Link to="/signup" className="text-indigo-600 hover:text-indigo-700 font-medium">
                Creează unul
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
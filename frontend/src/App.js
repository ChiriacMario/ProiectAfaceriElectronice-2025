import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import BookDetails from "./pages/BookDetails";
import Cart from "./pages/Cart";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import "./index.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function App() {
  const [q, setQ] = useState(() => localStorage.getItem("search:q") || "");
  const [sort, setSort] = useState(() => localStorage.getItem("search:sort") || "nou");
  const [page, setPage] = useState(1);

  useEffect(() => { setPage(1); }, [q, sort]);

  return (
    <BrowserRouter>
      <Navbar
        q={q}
        onSearch={setQ}
        sort={sort}
        onSortChange={setSort}
      />
      <Routes>
        <Route path="/" element={<Home q={q} sort={sort} page={page} setPage={setPage} />} />
        <Route path="/book/:id" element={<BookDetails />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
      <ToastContainer
        position="bottom-right"
        autoClose={1600}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss={false}
        pauseOnHover
        draggable
        theme="colored"
      />
    </BrowserRouter>
  );
}
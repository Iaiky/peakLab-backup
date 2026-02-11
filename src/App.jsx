// src/App.jsx
import { Routes, Route, useLocation } from "react-router-dom";
import { AuthGuard } from "./components/AuthGuard";

//Layout
import AdminLayout from "./layouts/AdminLayout";

//utilisateur
import Navbar from "./components/Navbar";
import Shop from "./pages/Shop"; // Renomme ton ancien contenu de App.jsx en Shop.jsx
import Auth from "./pages/Auth";
import Cart from "./pages/Cart";
import Profile from "./pages/Profile";

//Admin
import AdminProducts from "./pages/admin/AdminProducts";
import AdminAddProduct from "./pages/admin/AdminAddProduct";
import AdminInventory from "./pages/admin/AdminInventory";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminSales from "./pages/admin/AdminSales";
import AdminDashboard from "./components/admin/AdminDashboard";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminInventoryHistory from "./pages/admin/AdminInventoryHistory";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminCustomerDetail from "./pages/admin/AdminCustomerDetail";

function App() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  // On affiche la Navbar uniquement si on n'est PAS sur la page /auth
  const isAuthPage = location.pathname === "/auth";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 1. NAVBAR CLIENT : Uniquement si pas admin et pas auth */}
      {!isAdmin && !isAuthPage && <Navbar />}
      
      {/* 2. ROUTES : Pas de div avec pl-64 ici ! */}
      <Routes>
        {/* Routes Client */}
        <Route path="/" element={<Shop />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/cart" element={<Cart />} />

        {/* --- ROUTES PROTÉGÉES --- */}
        <Route element={<AuthGuard />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="products/add" element={<AdminAddProduct />} />
            <Route path="inventory" element={<AdminInventory />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="sales" element={<AdminSales />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="inventory/history" element={<AdminInventoryHistory />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="customers/:id" element={<AdminCustomerDetail />} />
          </Route>
        </Route>
      </Routes>
    </div>
  );
}

export default App;
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";

// pages
import Login from "./pages/Login";
import Customers from "./pages/Customers";
import Inventory from "./pages/Inventory";
import Menu from "./pages/Menu";
import Pos from "./pages/Pos";
import Admin from "./pages/Admin";
import Checkout from "./components/pos/Checkout";
import Receipt from "./components/pos/Receipt";

export default function App() {
  return (
    <Routes>
      {/* public */}
      <Route path="/login" element={<Login />} />

      {/* dashboard menu*/}
      <Route element={<DashboardLayout />}>
        <Route index element={<Pos />} />              
        <Route path="pos" element={<Pos />} />
        <Route path="pos/checkout" element={<Checkout />} />
        <Route path="pos/checkout/receipt" element={<Receipt />} />
        <Route path="/pos/checkout/receipt/:checkoutId" element={<Receipt />} />
        <Route path="customers" element={<Customers />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="menu" element={<Menu />} />
        <Route path="admin" element={<Admin />} />
      </Route>

      {/* fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
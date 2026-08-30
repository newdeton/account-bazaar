import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";

import Home from "./pages/Home/Home";
import Accounts from "./pages/Accounts/Accounts";
import Proxies from "./pages/Proxies/Proxies";
import Training from "./pages/Training/Training";
import Services from "./pages/Services/Services";
import ProductDetails from "./pages/ProductDetails/ProductDetails";
import Cart from "./pages/Cart/Cart";
import Contact from "./pages/Contact/Contact";
import MyBookings from "./pages/MyBookings/MyBookings";
import MyOrders from "./pages/MyOrders/MyOrders";

/* ADMIN */
import AdminLayout from "./admin/layout/AdminLayout";
import Dashboard from "./admin/pages/Dashboard/Dashboard";
import AdminAccounts from "./admin/pages/Accounts/Accounts";
import AdminProducts from "./admin/pages/Products/Products";
import AdminProxies from "./admin/pages/Proxies/Proxies";
import AdminServices from "./admin/pages/Services/Services";
import AdminTraining from "./admin/pages/Training/Training";
import AdminMessages from "./admin/pages/Messages/Messages";
import AdminSettings from "./admin/pages/Settings/Settings";

import Payment from "./pages/Payment/Payment";

import "./App.css";

function App() {
  return (
    <Routes>

      {/* ================= USER WEBSITE ================= */}

      <Route
        path="/*"
        element={
          <div className="app">
            <Navbar />

            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/accounts" element={<Accounts />} />
                <Route path="/proxies" element={<Proxies />} />
                <Route path="/training" element={<Training />} />
                <Route path="/services" element={<Services />} />
                <Route
                  path="/product/:id"
                  element={<ProductDetails />}
                />
                <Route path="/cart" element={<Cart />} />
                <Route path="/contact" element={<Contact />} />
                <Route
                  path="/my-bookings"
                  element={<MyBookings />}
                />
                <Route path="/payment" element={<Payment />} />
              </Routes>
              <Route path="/my-orders" element={<MyOrders />} />
            </main>

            <Footer />
          </div>
        }
      />

      {/* ================= ADMIN ================= */}

      <Route path="/admin" element={<AdminLayout />}>

        <Route index element={<Dashboard />} />

        <Route
          path="accounts"
          element={<AdminAccounts />}
        />

        <Route
          path="products"
          element={<AdminProducts />}
        />

        <Route
          path="proxies"
          element={<AdminProxies />}
        />

        <Route
          path="services"
          element={<AdminServices />}
        />

        <Route
          path="training"
          element={<AdminTraining />}
        />

        <Route
          path="messages"
          element={<AdminMessages />}
        />

        <Route
          path="settings"
          element={<AdminSettings />}
        />

      </Route>

    </Routes>
  );
}

export default App;
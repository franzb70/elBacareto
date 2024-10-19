import React from 'react'
import ReactDOM from 'react-dom/client'
import reportWebVitals from './reportWebVitals'
import { BrowserRouter, Routes, Route } from "react-router-dom"
import Order from './pages/Order.js'
import Prodotti from './pages/Prodotti.js'
import Login from './pages/Login.js'
import Register from './pages/Register.js'
import App from "./pages/App.js"
import Admin from "./pages/Admin.js"
import Settings from "./pages/Settings.js"
import MyBookings from "./pages/MyBookings.js"

const root = ReactDOM.createRoot(document.getElementById('root'));
window.logged = false
window.forcelogout = false
window.settingsChanged = false

const initialOptions = {
  clientId: "AeXYjuioxv3q9OQwpHM9VsGdhRBJzJmeuzNxlv2Nl5zt1AC0gWx9Ou0OcQgb1DVd16G7bvsxOCeYFtwe",
  currency: "Euro",
  intent: "capture",
}

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
      <Route path="/" element={ <App /> } />
      <Route path="/login" element={ <Login /> } />
      <Route path="/registrazione" element={ <Register /> } />
      <Route path="/ordine" element={ <Order /> } />
      <Route path="/prodotti" element={ <Prodotti /> } />
      <Route path="/prenotazioni" element={ <MyBookings /> } />
      <Route path="/admin" element={ <Admin /> } />
      <Route path="/impostazioni" element={ <Settings /> } />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()

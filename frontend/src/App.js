// Main React App component
import React from 'react';
import { BrowserRouter as Router, Routes, Route, useParams } from 'react-router-dom';
import Hub from './components/Hub/Hub';
import TourEditor from './components/Editor/TourEditor';
import EmbedPage from './pages/EmbedPage';
import LandingMap from './components/LandingMap';
import TourViewer from './components/Viewer/TourViewer';
import LandingPage from './pages/LandingPage';
import Shop from './components/Shop/Shop';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import AuthCallback from './components/Auth/AuthCallback';
import Comercios360 from './components/Comercios360/Comercios360';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import { UserProvider } from './context/UserContext';
import { CartProvider } from './context/CartContext';
import UserCircle from './components/UserCircle';
import Cart from './components/Cart/Cart';
import './App.css';

function TourEditorWrapper() {
  const { tourId } = useParams();
  return <TourEditor tourId={tourId} />;
}

function ShopWrapper() {
  const { tourId } = useParams();
  return <Shop tourId={tourId} />;
}

function LayoutWithUser({ children }) {
  // Oculta el UserCircle en rutas específicas
  const hideUserCircle = window.location.pathname.startsWith('/map')
    || window.location.pathname.startsWith('/viewer')
    || window.location.pathname.startsWith('/embed')
    || window.location.pathname.startsWith('/comercios360');
  return (
    <div>
      {!hideUserCircle && (
        <div style={{ position: 'fixed', top: 22, right: 32, zIndex: 999 }}>
          <UserCircle />
        </div>
      )}
      {children}
    </div>
  );
}

function App() {
  return (
    <UserProvider>
      <CartProvider>
        <Router>
          <LayoutWithUser>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/" element={<LandingPage />} />
              <Route path="/comercios360" element={<Comercios360 />} />
              <Route path="/map" element={<LandingMap />} />
              
              {/* Rutas protegidas que requieren rol de admin */}
              <Route path="/hub" element={
                <ProtectedRoute requireAdmin={true}>
                  <Hub />
                </ProtectedRoute>
              } />
              <Route path="/editor/:tourId" element={
                <ProtectedRoute requireAdmin={true}>
                  <TourEditorWrapper />
                </ProtectedRoute>
              } />
              
              {/* Rutas públicas */}
              <Route path="/viewer/:tourId" element={<TourViewer />} />
              <Route path="/embed/:apiKey" element={<EmbedPage />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/shop/:tourId" element={<ShopWrapper />} />
            </Routes>
            <Cart />
          </LayoutWithUser>
        </Router>
      </CartProvider>
    </UserProvider>
  );
}

export default App;
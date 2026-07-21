import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { NotificationProvider } from './context/NotificationContext';
import AppRoutes from './routes/AppRoutes';

const App: React.FC = () => (
  <BrowserRouter>
    <AuthProvider>
      <NotificationProvider>
        <CartProvider>
          <AppRoutes />
        </CartProvider>
      </NotificationProvider>
    </AuthProvider>
  </BrowserRouter>
);

export default App;

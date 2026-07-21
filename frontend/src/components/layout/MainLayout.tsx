import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import AIChatWidget from '../../components/ai/AIChatWidget';

const MainLayout: React.FC = () => (
  <div className="min-h-screen flex flex-col bg-surface">
    <Header />
    <main className="flex-1">
      <Outlet />
    </main>
    <Footer />
    <AIChatWidget />
  </div>
);

export default MainLayout;

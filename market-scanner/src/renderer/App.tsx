import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Trending from './pages/Trending';
import News from './pages/News';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';
import { AlertProvider } from './context/AlertContext';

export default function App() {
  return (
    <HashRouter>
      <AlertProvider>
        <div className="app-layout">
          <Sidebar />
          <main className="app-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/trending" element={<Trending />} />
              <Route path="/news" element={<News />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </AlertProvider>
    </HashRouter>
  );
}

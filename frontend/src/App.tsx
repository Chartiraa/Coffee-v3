import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Menu from './pages/Menu';
import Orders from './pages/Orders';
import NewOrder from './pages/NewOrder';
import Tables from './pages/Tables';
import Inventory from './pages/Inventory';
import Payments from './pages/Payments';
import Cashier from './pages/Cashier';
import Reports from './pages/Reports';
import WaiterRequests from './pages/WaiterRequests';
import AuthGuard from './components/AuthGuard';
import TokenHandler from './components/TokenHandler';

function App() {
  return (
    <>
      <TokenHandler />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <AuthGuard>
            <Layout>
              <Dashboard />
            </Layout>
          </AuthGuard>
        } />
        <Route path="/menu" element={
          <AuthGuard>
            <Layout>
              <Menu />
            </Layout>
          </AuthGuard>
        } />
        <Route path="/waiter-requests" element={
          <AuthGuard>
            <Layout>
              <WaiterRequests />
            </Layout>
          </AuthGuard>
        } />
        <Route path="/orders" element={
          <AuthGuard>
            <Layout>
              <Orders />
            </Layout>
          </AuthGuard>
        } />
        <Route path="/orders/new" element={
          <AuthGuard>
            <Layout>
              <NewOrder />
            </Layout>
          </AuthGuard>
        } />
        <Route path="/new-order" element={
          <AuthGuard>
            <Layout>
              <NewOrder />
            </Layout>
          </AuthGuard>
        } />
        <Route path="/tables" element={
          <AuthGuard>
            <Layout>
              <Tables />
            </Layout>
          </AuthGuard>
        } />
        <Route path="/inventory" element={
          <AuthGuard>
            <Layout>
              <Inventory />
            </Layout>
          </AuthGuard>
        } />
        <Route path="/payments" element={
          <AuthGuard>
            <Layout>
              <Payments />
            </Layout>
          </AuthGuard>
        } />
        <Route path="/cashier" element={
          <AuthGuard>
            <Layout>
              <Cashier />
            </Layout>
          </AuthGuard>
        } />
        <Route path="/reports" element={
          <AuthGuard>
            <Layout>
              <Reports />
            </Layout>
          </AuthGuard>
        } />
        <Route path="/profile" element={
          <AuthGuard>
            <Layout>
              <Profile />
            </Layout>
          </AuthGuard>
        } />
      </Routes>
    </>
  );
}

export default App; 
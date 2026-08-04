import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AssetListPage from './pages/AssetListPage';
import AssetFormPage from './pages/AssetFormPage';
import CategoryPage from './pages/CategoryPage';
import LocationPage from './pages/LocationPage';
import SupplierPage from './pages/SupplierPage';
import DepartmentPage from './pages/DepartmentPage';
import MaintenancePage from './pages/MaintenancePage';
import InventoryPage from './pages/InventoryPage';
import UserManagementPage from './pages/UserManagementPage';
import RoleManagementPage from './pages/RoleManagementPage';
import ProfilePage from './pages/ProfilePage';
import PublicAssetPage from './pages/PublicAssetPage';
import PurchaseProposalPage from './pages/PurchaseProposalPage';
import AuditLogPage from './pages/AuditLogPage';
import VehicleRegistrationPage from './pages/VehicleRegistrationPage';
import UserGuidePage from './layouts/UserGuidePage';
import { departmentsAPI } from './api';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          {/* Public route for QR code scanning - no auth required */}
          {/* TODO: [User] - Route này cho phép quét QR mà không cần đăng nhập */}
          <Route path="/asset" element={<PublicAssetPage />} />
          <Route path="/asset/:id" element={<PublicAssetPage />} />
          <Route path="/asset/code/:code" element={<PublicAssetPage />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <MainLayout>
                <DashboardPage />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/assets" element={
            <ProtectedRoute>
              <MainLayout>
                <AssetListPage />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/assets/:id" element={
            <ProtectedRoute>
              <MainLayout>
                <AssetFormPage />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/categories" element={
            <ProtectedRoute>
              <MainLayout>
                <CategoryPage />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/locations" element={
            <ProtectedRoute>
              <MainLayout>
                <LocationPage />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/suppliers" element={
            <ProtectedRoute>
              <MainLayout>
                <SupplierPage />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/departments" element={
            <ProtectedRoute>
              <MainLayout>
                <DepartmentPage />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/maintenance" element={
            <ProtectedRoute>
              <MainLayout>
                <MaintenancePage />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/inventory" element={
            <ProtectedRoute>
              <MainLayout>
                <InventoryPage />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/user-guide" element={
            <ProtectedRoute>
              {/* Trang hướng dẫn không cần MainLayout vì nó đã có sidebar riêng */}
              <UserGuidePage />
            </ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute requiredPermission="MANAGE_USERS">
              <MainLayout>
                <UserManagementPage />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/roles" element={
            <ProtectedRoute requiredPermission="MANAGE_ROLES">
              <MainLayout>
                <RoleManagementPage />
              </MainLayout>
            </ProtectedRoute>
          } />

          <Route path="/audit-logs" element={
            <ProtectedRoute requiredPermission="MANAGE_USERS">
              <MainLayout>
                <AuditLogPage />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/purchases" element={
            <ProtectedRoute requiredPermission="MANAGE_PURCHASE_PROPOSALS">
              <MainLayout>
                <PurchaseProposalPage />
              </MainLayout>
            </ProtectedRoute>
          } />

          <Route path="/vehicle-registrations" element={
            <ProtectedRoute requiredPermission="VIEW_VEHICLE_REGISTRATIONS">
              <MainLayout>
                <VehicleRegistrationPage />
              </MainLayout>
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute>
              <MainLayout>
                <ProfilePage />
              </MainLayout>
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

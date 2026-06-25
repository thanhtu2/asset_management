import axios from 'axios';

// sử dụng api tĩnh dev
// const API_BASE_URL = 'http://192.168.90.105:3001/api';



// Chỉ sử dụng biến môi trường.
// Nếu không có biến môi trường (như trên Vercel), tự động fallback về relative path '/api'
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

if (!API_BASE_URL) {
  console.error("VITE_API_URL is missing. Please check your .env file!");
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Response Interceptor: Xử lý lỗi 401 (token hết hạn/không hợp lệ)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Kiểm tra nếu lỗi là 401 và không phải từ trang login
    if (error.response && error.response.status === 401 && !error.config.url.endsWith('/auth/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Chỉ tự động chuyển hướng nếu KHÔNG PHẢI là trang công khai (quét mã QR)
      const isPublicRoute = window.location.pathname.startsWith('/asset');
      const isLoginRoute = window.location.pathname === '/login';

      if (!isPublicRoute && !isLoginRoute) {
        window.location.href = `/login?redirect=${window.location.pathname}`;
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (username, password) => apiClient.post('/auth/login', { username, password }),
  register: (userData) => apiClient.post('/auth/register', userData),
  logout: () => apiClient.post('/auth/logout'),
  getProfile: () => apiClient.get('/auth/profile'),
  updateProfile: (data) => apiClient.put('/auth/profile', data),
  changePassword: (passwords) => apiClient.post('/auth/change-password', passwords),
};

// Assets API
export const assetsAPI = {
  getAll: (params) => apiClient.get('/assets', { params }),
  getAllSimple: () => apiClient.get('/assets/all'),
  getById: (id) => apiClient.get(`/assets/${id}`),
  getByCode: (code) => apiClient.get(`/assets/code/${code}`),
  getByBarcode: (barcode) => apiClient.get(`/assets/barcode/${barcode}`),
  create: (data) => apiClient.post('/assets', data),
  update: (id, data) => apiClient.put(`/assets/${id}`, data),
  delete: (id) => apiClient.delete(`/assets/${id}`),
  getQRCode: (id) => apiClient.get(`/assets/${id}/qrcode`, {
    params: { origin: window.location.origin }
  }),
  reportDamage: (id, description) => apiClient.post(`/assets/public/${id}/report-damage`, { description }),
  getUserHistory: (id) => apiClient.get(`/assets/${id}/user-history`),
  updateStatus: (id, status, description) => apiClient.patch(`/assets/${id}/status`, { status, description }),
  reportDamage: (id, description) => apiClient.post(`/assets/public/${id}/report-damage`, { description }),
  importAssets: (formData) => apiClient.post('/assets/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  downloadTemplate: () => apiClient.get('/assets/template', { responseType: 'blob' }),
  exportAssets: async () => {
    const response = await apiClient.get('/assets/export', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'danh_sach_tai_san.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};

// Categories API
export const categoriesAPI = {
  getAll: (params) => apiClient.get('/categories', { params }),
  getAllSimple: () => apiClient.get('/categories/all'),
  create: (data) => apiClient.post('/categories', data),
  update: (id, data) => apiClient.put(`/categories/${id}`, data),
  delete: (id) => apiClient.delete(`/categories/${id}`),
};

// Locations API
export const locationsAPI = {
  getAll: (params) => apiClient.get('/locations', { params }),
  getAllSimple: () => apiClient.get('/locations/all'),
  create: (data) => apiClient.post('/locations', data),
  update: (id, data) => apiClient.put(`/locations/${id}`, data),
  delete: (id) => apiClient.delete(`/locations/${id}`),
};

// Departments API
export const departmentsAPI = {
  getAll: (params) => apiClient.get('/departments', { params }),
  getAllSimple: () => apiClient.get('/departments?simple=true'),
  // getAllSimple: () => apiClient.get('/departments/simple'),
  create: (data) => apiClient.post('/departments', data),
  update: (id, data) => apiClient.put(`/departments/${id}`, data),
  delete: (id) => apiClient.delete(`/departments/${id}`),
};

// Suppliers API
export const suppliersAPI = {
  getAll: (params) => apiClient.get('/suppliers', { params }),
  create: (data) => apiClient.post('/suppliers', data),
  update: (id, data) => apiClient.put(`/suppliers/${id}`, data),
  delete: (id) => apiClient.delete(`/suppliers/${id}`),
};

// Users API
export const usersAPI = {
  getAll: () => apiClient.get('/users'),
  getAllSimple: () => apiClient.get('/users/simple'), // 
  create: (data) => apiClient.post('/users', data),
  update: (id, data) => apiClient.put(`/users/${id}`, data),
  delete: (id) => apiClient.delete(`/users/${id}`),
  exportUsers: async () => {
    const response = await apiClient.get('/users/export', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'danh_sach_nguoi_dung.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};

// Maintenance API
export const maintenanceAPI = {
  getAll: (params) => apiClient.get('/maintenance', { params }),
  create: (data) => apiClient.post('/maintenance', data),
  update: (id, data) => apiClient.put(`/maintenance/${id}`, data),
  delete: (id) => apiClient.delete(`/maintenance/${id}`),
  completeRepair: (data) => apiClient.post('/maintenance/complete-repair', data),
};

// Inventory API
export const inventoryAPI = {
  getAll: () => apiClient.get('/inventory'),
  create: (data) => apiClient.post('/inventory', data),
  delete: (id) => apiClient.delete(`/inventory/${id}`),
  addAssetsByDepartment: (sessionId, departmentId) => apiClient.post(`/inventory/${sessionId}/add-by-department`, { department_id: departmentId }),
  addAllAssets: (sessionId) => apiClient.post(`/inventory/${sessionId}/add-all`),
  getRecordsByDepartment: (sessionId) => apiClient.get(`/inventory/${sessionId}/records-by-department`),
  getSummaryByDepartment: (sessionId) => apiClient.get(`/inventory/${sessionId}/summary-by-department`),
  getRecords: (sessionId) => apiClient.get(`/inventory/${sessionId}/records`),
  updateRecord: (sessionId, recordId, data) => apiClient.put(`/inventory/${sessionId}/records/${recordId}`, data),
  complete: (id) => apiClient.post(`/inventory/${id}/complete`),
  exportInventoryReport: async (id) => {
    const response = await apiClient.get(`/inventory/${id}/export`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    // Lấy tên file từ header Content-Disposition nếu có, nếu không thì dùng tên mặc định
    const contentDisposition = response.headers['content-disposition'];
    let filename = `bao_cao_kiem_ke_${id}.xlsx`;
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1];
      }
    }
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
  scanAsset: (sessionId, data) => apiClient.post(`/inventory/${sessionId}/scan`, data),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => apiClient.get('/dashboard'),
};

// Roles API
export const rolesAPI = {
  getAll: () => apiClient.get('/roles'),
  create: (data) => apiClient.post('/roles', data),
  getPermissions: (roleCode) => apiClient.get(`/roles/${roleCode}/permissions`),
  updatePermissions: (roleCode, permissions) => apiClient.post(`/roles/${roleCode}/permissions`, { permissions }),
};

// Permissions API
export const permissionsAPI = {
  getAll: () => apiClient.get('/permissions'),
  create: (data) => apiClient.post('/permissions', data),
};

export const notificationsAPI = {
  getAll: () => apiClient.get('/notifications'),
  markAsRead: (id) => apiClient.put(`/notifications/${id}/read`),
};

// Audit Logs API
export const auditLogsAPI = {
  getAll: (params) => apiClient.get('/audit-logs', { params }),
};

// Purchase Proposals API
export const purchaseProposalsAPI = {
  // getAll: (params) => apiClient.get('/purchases', { params }),
  getAll: (params) => apiClient.get('/purchases', { params }),
  getById: (id) => apiClient.get(`/purchases/${id}`),
  create: (data) => apiClient.post('/purchases', data),
  update: (id, data) => apiClient.put(`/purchases/${id}`, data),
  delete: (id) => apiClient.delete(`/purchases/${id}`),
};

// Vehicles API
export const vehiclesAPI = {
  getAll: () => apiClient.get('/vehicles'),
};

export const vehicleRegistrationsAPI = {
  getAll: (params) => apiClient.get('/vehicle-registrations', { params }),
  getById: (id) => apiClient.get(`/vehicle-registrations/${id}`),
  create: (data) => apiClient.post('/vehicle-registrations', data),
  update: (id, data) => apiClient.put(`/vehicle-registrations/${id}`, data),
  delete: (id) => apiClient.delete(`/vehicle-registrations/${id}`),
  getVehicles: () => apiClient.get('/vehicles'),
};

export const vehicleTripsAPI = {
  getAll: (params) => apiClient.get('/vehicle-trips', { params }),
  getById: (id) => apiClient.get(`/vehicle-trips/${id}`),
  create: (data) => apiClient.post('/vehicle-trips', data),
  update: (id, data) => apiClient.put(`/vehicle-trips/${id}`, data),
  delete: (id) => apiClient.delete(`/vehicle-trips/${id}`),
};

export default apiClient;

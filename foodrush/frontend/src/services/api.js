

import axios from 'axios';

const api = axios.create({
  baseURL: '/api', 
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});


api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);


export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};


export const foodAPI = {
  getAll: (params) => api.get('/food', { params }),
  getById: (id) => api.get(`/food/${id}`),
  getFeatured: () => api.get('/food/featured'),
  getCategories: () => api.get('/food/categories'),
  create: (data) => api.post('/food', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/food/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/food/${id}`),
  addReview: (id, data) => api.post(`/food/${id}/reviews`, data),
};


export const cartAPI = {
  get: () => api.get('/cart'),
  add: (foodId) => api.post('/cart/add', { foodId }),
  remove: (foodId) => api.post('/cart/remove', { foodId }),
  removeItem: (foodId) => api.delete(`/cart/${foodId}`),
  clear: () => api.delete('/cart'),
};

export const orderAPI = {
  place: (data) => api.post('/orders', data),
  getMyOrders: () => api.get('/orders/my-orders'),
  getById: (id) => api.get(`/orders/${id}`),
  cancel: (id, reason) => api.put(`/orders/${id}/cancel`, { reason }),


  getAll: (params) => api.get('/orders', { params }),
  updateStatus: (id, status, note) => api.put(`/orders/${id}/status`, { status, note }),
};

export const paymentAPI = {
  createOrder: (orderId) => api.post('/payment/create-order', { orderId }),
  verify: (data) => api.post('/payment/verify', data),
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  toggleUser: (id) => api.put(`/admin/users/${id}/toggle`),
};

export default api;

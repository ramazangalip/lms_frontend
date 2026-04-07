import axios from 'axios';

// Backend adresini merkezi olarak buradan yönetiyoruz
const api = axios.create({
  baseURL: 'https:/api.yapayzekadesteklisinif.com.tr/api',
});

// Axios Interceptor: Her istek gönderilmeden hemen önce araya girer
api.interceptors.request.use((config) => {
  // Tarayıcı tarafında olduğumuzdan emin olalım
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    // Eğer hafızada token varsa, isteğin "Header" kısmına ekle
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;
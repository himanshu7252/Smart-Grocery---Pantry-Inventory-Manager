import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor to inject JWT Token dynamically
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.error('Error fetching token from storage:', e);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle caching
api.interceptors.response.use(
  async (response) => {
    // Check if offline caching is enabled (defaults to true if not explicitly set to 'false')
    const cachingEnabled = await AsyncStorage.getItem('pref_offline_caching');
    if (cachingEnabled !== 'false' && response.config.method === 'get') {
      const cacheKey = `cache_${response.config.url}_${JSON.stringify(response.config.params || {})}`;
      try {
        await AsyncStorage.setItem(cacheKey, JSON.stringify(response.data));
      } catch (err) {
        console.error('Failed to write API response to cache:', err);
      }
    }
    return response;
  },
  async (error) => {
    // If request failed (e.g. network error, timeout), try to fall back to cache
    const cachingEnabled = await AsyncStorage.getItem('pref_offline_caching');
    if (cachingEnabled !== 'false' && error.config && error.config.method === 'get') {
      const cacheKey = `cache_${error.config.url}_${JSON.stringify(error.config.params || {})}`;
      try {
        const cachedData = await AsyncStorage.getItem(cacheKey);
        if (cachedData) {
          // Return simulated successful response containing cached data
          return {
            data: JSON.parse(cachedData),
            status: 200,
            statusText: 'OK',
            headers: {},
            config: error.config
          };
        }
      } catch (err) {
        console.error('Failed to read API response from cache:', err);
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Base API client for local Vite development and the deployed Vercel frontend.
// VITE_API_URL should be set in Vercel, but the production fallback keeps the
// authentication flow working when the environment variable is missing.
const configuredApiUrl = (import.meta.env.VITE_API_URL || '').trim();
const productionApiUrl = 'https://meeting-action.onrender.com/api';
const API_BASE_URL = configuredApiUrl || (
  import.meta.env.PROD ? productionApiUrl : '/api'
);

class ApiClient {
  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.token = localStorage.getItem('g13_auth_token') || null;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('g13_auth_token', token);
    } else {
      localStorage.removeItem('g13_auth_token');
    }
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${this.baseUrl}${normalizedEndpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = (
          responseData.error && typeof responseData.error === 'object'
            ? responseData.error.message
            : responseData.error
        ) || responseData.message || `HTTP error! status: ${response.status}`;
        const error = new Error(message);
        error.status = response.status;
        error.code = (
          responseData.error && typeof responseData.error === 'object'
            ? responseData.error.code
            : null
        ) || responseData.code;
        error.notRegistered = Boolean(
          responseData.notRegistered || error.code === 'USER_NOT_FOUND' || response.status === 404
        );
        throw error;
      }

      return responseData;
    } catch (error) {
      console.warn(`[API] Request failed for ${url}:`, error.message);
      throw error;
    }
  }

  get(endpoint, options) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, body, options) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  put(endpoint, body, options) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  delete(endpoint, options) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

export const api = new ApiClient();
export default api;

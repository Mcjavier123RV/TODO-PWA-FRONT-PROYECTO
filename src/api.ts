import axios from 'axios';

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
});

export function setAuth(token: string | null) {
    if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    else delete api.defaults.headers.common['Authorization'];
}

// Funciones para manejar el usuario
export function setUser(user: any) {
    localStorage.setItem('user', JSON.stringify(user));
}

export function getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

export function clearAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuth(null);
}

// Inicializar con el token guardado
setAuth(localStorage.getItem('token'));

// Si el token expira o es inválido, limpiar y redirigir al login
api.interceptors.response.use(
    (r) => r,
    (err) => {
        if (err.response?.status === 401) {
            clearAuth();
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);
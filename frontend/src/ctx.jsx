import { createContext, useContext, useState, useCallback } from 'react';
import { api } from './api';

const AuthCtx = createContext();
const ToastCtx = createContext();
export const useAuth = () => useContext(AuthCtx);
export const useToast = () => useContext(ToastCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));
  const save = (d) => {
    localStorage.setItem('token', d.token);
    localStorage.setItem('user', JSON.stringify(d.user));
    setUser(d.user);
  };
  const login = async (email, password) => save(await api('/auth/login', 'POST', { email, password }));
  const register = async (form) => save(await api('/auth/register', 'POST', form));
  const logout = () => { localStorage.clear(); setUser(null); };
  return <AuthCtx.Provider value={{ user, login, register, logout }}>{children}</AuthCtx.Provider>;
}

export function ToastProvider({ children }) {
  const [t, setT] = useState(null);
  const show = useCallback((msg, type = 'ok') => {
    setT({ msg, type });
    setTimeout(() => setT(null), 3000);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      {t && <div className={'toast ' + t.type} role="status">{t.msg}</div>}
    </ToastCtx.Provider>
  );
}

/**
 * BIKAN Auth Service
 * ──────────────────
 * MVP Authentication layer.
 * Saat ini menggunakan localStorage + mock validation.
 * Siap disambungkan ke NeonDB (ims_core.users) saat backend ready.
 */

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'instructor' | 'admin';
}

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

const STORAGE_KEY = 'bikan-auth-session';
const USERS_KEY = 'bikan-registered-users';

// ─── Get stored users (mock DB) ───
function getStoredUsers(): Array<{ email: string; password: string; name: string; role: string }> {
  const raw = localStorage.getItem(USERS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveUsers(users: Array<{ email: string; password: string; name: string; role: string }>) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// ─── Register ───
export function register(name: string, email: string, password: string): AuthResult {
  if (!name || !email || !password) {
    return { success: false, error: 'Semua field wajib diisi' };
  }

  if (password.length < 6) {
    return { success: false, error: 'Password minimal 6 karakter' };
  }

  const users = getStoredUsers();
  if (users.find(u => u.email === email)) {
    return { success: false, error: 'Email sudah terdaftar' };
  }

  const newUser = { email, password, name, role: 'student' };
  users.push(newUser);
  saveUsers(users);

  const user: User = {
    id: `user-${Date.now()}`,
    name,
    email,
    role: 'student',
  };

  // Auto-login after register
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  return { success: true, user };
}

// ─── Login ───
export function login(email: string, password: string): AuthResult {
  if (!email || !password) {
    return { success: false, error: 'Email dan password wajib diisi' };
  }

  const users = getStoredUsers();
  const found = users.find(u => u.email === email && u.password === password);

  if (!found) {
    return { success: false, error: 'Email atau password salah' };
  }

  const user: User = {
    id: `user-${email.replace(/[^a-z0-9]/g, '')}`,
    name: found.name,
    email: found.email,
    role: found.role as User['role'],
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  return { success: true, user };
}

// ─── Logout ───
export function logout(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// ─── Get current session ───
export function getCurrentUser(): User | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

// ─── Check if authenticated ───
export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

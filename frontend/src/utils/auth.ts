// Token'ı localStorage'dan al
export const getToken = (): string | null => {
  return localStorage.getItem('token');
};

// Token'ı localStorage'a kaydet
export const setToken = (token: string): void => {
  localStorage.setItem('token', token);
};

// Token'ı localStorage'dan sil
export const removeToken = (): void => {
  localStorage.removeItem('token');
};

// Kullanıcının giriş yapmış olup olmadığını kontrol et
export const isAuthenticated = (): boolean => {
  return !!getToken();
}; 
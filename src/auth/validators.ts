// src/auth/validators.ts
// Input validation utilities

export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password: string): boolean => {
  // minimum 6 characters
  return password.length >= 6;
};

export const validateUsername = (username: string): boolean => {
  // alphanumeric and underscores, 3-20 chars
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
};

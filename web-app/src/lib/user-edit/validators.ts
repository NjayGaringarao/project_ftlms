export const validateEmailFormat = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

export const normalizeName = (name: string): string =>
  name.trim().split(/\s+/).filter(Boolean).join(" ");

export const validatePassword = (
  password: string,
  confirmPassword: string,
  minLength = 8,
): string | null => {
  if (!password.trim()) return "New password is required";
  if (password.length < minLength) {
    return `Password must be at least ${minLength} characters long`;
  }
  if (password !== confirmPassword) return "Passwords do not match";
  return null;
};

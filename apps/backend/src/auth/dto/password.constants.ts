export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_COMPLEXITY_REGEX =
  /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;
export const PASSWORD_COMPLEXITY_MESSAGE =
  'Password must contain at least one uppercase letter, one number, and one special character';

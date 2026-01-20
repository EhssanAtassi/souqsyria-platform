/**
 * 🧾 UserFromToken
 *
 * This interface defines the expected shape of the user object
 * injected via Firebase JWT or custom authentication guards.
 * It ensures consistent typing when using the @CurrentUser() decorator.
 */

export interface UserFromToken {
  id: number; // <-- INTERNAL DB ID
  email: string;
  role_id: number;
  firebase_uid: string;
  [key: string]: any;
}

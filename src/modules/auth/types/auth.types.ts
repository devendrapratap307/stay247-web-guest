export interface Me { id: string; email: string; name?: string; phone?: string; language?: 'en' | 'hi' }
export interface RegisterResult { email: string; verification_required: boolean }
export interface UpdateMeBody { name?: string; phone?: string; language?: 'en' | 'hi'; current_password?: string; new_password?: string }

/** Screens of the sign-in overlay (prototype: Welcome back → Create account → Verify email; Forgot → code → new password). */
export type AuthScreen = 'login' | 'otp-login' | 'signup' | 'verify' | 'forgot' | 'forgot-code' | 'reset' | 'reset-done';

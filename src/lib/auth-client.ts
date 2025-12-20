import { createAuthClient } from "better-auth/react";
export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  baseURL: "http://localhost:3000",
});

export const signInWithGoogle = (callbackURL?: string) =>
  authClient.signIn.social({
    provider: "google",
    callbackURL,
  });

export const signOut = () => authClient.signOut();

export const getSession = () => authClient.getSession();

// Reactive session hook (subscribes to Better Auth's internal store)
export const useSession = () => authClient.useSession();

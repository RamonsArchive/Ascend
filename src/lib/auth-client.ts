import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL, // or omit entirely for same-origin
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

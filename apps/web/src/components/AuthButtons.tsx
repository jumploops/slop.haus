"use client";

import { signIn, signOut, useSession } from "@/lib/auth-client";

export function AuthButtons() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return <div className="auth-buttons">Loading...</div>;
  }

  if (session?.user) {
    return (
      <div className="auth-buttons">
        <span className="user-name">{session.user.name}</span>
        <button onClick={() => signOut()} className="btn btn-secondary">
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="auth-buttons">
      <button
        onClick={() => signIn.social({ provider: "github" })}
        className="btn btn-primary"
      >
        Sign in with GitHub
      </button>
      <button
        onClick={() => signIn.social({ provider: "google" })}
        className="btn btn-secondary"
      >
        Sign in with Google
      </button>
    </div>
  );
}

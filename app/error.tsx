"use client";
import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="grid min-h-screen place-items-center bg-midnight px-6 text-center text-cream">
      <div>
        <h1 className="font-serif text-4xl">Something went wrong.</h1>
        <p className="mt-2 text-cream/60">Senja pergi, kopi menanti. Please try again.</p>
        <button onClick={reset} className="mt-6 rounded-full bg-glow px-6 py-3 text-sm text-midnight">
          Try again
        </button>
        <p className="mt-10 break-words font-mono text-[10px] text-cream/30">{error.message}</p>
      </div>
    </div>
  );
}
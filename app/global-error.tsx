"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#14252C",
          color: "#F5ECE2",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: 24,
        }}
      >
        <div>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 32, margin: 0 }}>Something went wrong.</h1>
          <p style={{ opacity: 0.6 }}>Senja pergi, kopi menanti. Please try again.</p>
          <button
            onClick={reset}
            style={{ marginTop: 16, padding: "12px 24px", borderRadius: 999, border: 0, background: "#F2B880", color: "#14252C" }}
          >
            Try again
          </button>
          <p style={{ marginTop: 32, fontFamily: "monospace", fontSize: 10, opacity: 0.4, wordBreak: "break-word" }}>
            {error.message}
          </p>
        </div>
      </body>
    </html>
  );
}
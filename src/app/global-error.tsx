"use client";

/**
 * Last-resort boundary for errors thrown in the root layout itself. Must
 * render its own <html>/<body> because the layout that normally provides
 * them has crashed. Deliberately dependency-free and inline-styled — if
 * we're here, nothing else can be trusted to load.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          background: "#fbfaf8",
          color: "#1c1917",
          margin: 0,
          padding: "24px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "28rem" }}>
          <h1 style={{ fontSize: "20px", margin: "0 0 12px" }}>
            Carbon Coach hit an unexpected error
          </h1>
          <p style={{ fontSize: "14px", lineHeight: 1.6, color: "#57534e" }}>
            Your data is stored in your browser and is not affected.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "16px",
              padding: "10px 18px",
              fontSize: "14px",
              fontWeight: 600,
              color: "#ffffff",
              background: "#059669",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Reload the app
          </button>
        </div>
      </body>
    </html>
  );
}

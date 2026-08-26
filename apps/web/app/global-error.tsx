"use client";

/** Kök layout'un kendisi patlarsa devreye giren son çare (kendi <html>/<body>'sini taşımalı). */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="tr">
      <body style={{ background: "#0a0a0f", color: "#e8e8ec", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", padding: "1.5rem", textAlign: "center" }}>
          <div>
            <h1 style={{ fontSize: "1.125rem", fontWeight: 600 }}>Uygulama açılamadı</h1>
            <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", opacity: 0.7 }}>
              Beklenmeyen bir hata oluştu.
            </p>
            {error.digest && (
              <p style={{ marginTop: "0.5rem", fontFamily: "monospace", fontSize: "0.75rem", opacity: 0.5 }}>
                hata kodu: {error.digest}
              </p>
            )}
            <button
              onClick={reset}
              style={{ marginTop: "1rem", padding: "0.5rem 1rem", background: "#17171f", color: "#e8e8ec", border: "1px solid #2a2a35", borderRadius: 6, cursor: "pointer" }}
            >
              Tekrar dene
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

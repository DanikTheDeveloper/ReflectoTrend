import React from "react";

/**
 * Brand tokens (mirror your Mantine theme)
 * ─────────────────────────────────────────
 * primary   #613DE4   violet
 * secondary #4E31B6   deep violet
 * accent    #FCE073   gold
 * bg        #566FAE   slate-blue  (used as a subtle mid-tone reference)
 */

// ─── Inject keyframes + utility animation classes once ───────────────────────
if (typeof document !== "undefined" && !document.getElementById("page-bg-keyframes")) {
    const style = document.createElement("style");
    style.id = "page-bg-keyframes";
    style.textContent = `
        @keyframes heroPulse {
            0%, 100% { opacity: 1;   transform: scale(1);   }
            50%       { opacity: 0.35; transform: scale(0.72); }
        }
        @keyframes heroFadeUp {
            from { opacity: 0; transform: translateY(20px); }
            to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes orbDrift {
            0%, 100% { transform: translate(0, 0);       }
            50%       { transform: translate(18px, -14px); }
        }
        .hfu-0 { animation: heroFadeUp 0.65s 0.00s ease both; }
        .hfu-1 { animation: heroFadeUp 0.65s 0.12s ease both; }
        .hfu-2 { animation: heroFadeUp 0.65s 0.26s ease both; }
        .hfu-3 { animation: heroFadeUp 0.65s 0.40s ease both; }
        .hfu-4 { animation: heroFadeUp 0.65s 0.55s ease both; }
    `;
    document.head.appendChild(style);
}

/**
 * PageBackground
 * Wraps any page in the branded dark-violet + dot-grid + glow-orb background.
 *
 * Usage:
 *   <PageBackground>
 *     <YourPage />
 *   </PageBackground>
 */
const PageBackground = ({ children, style: extraStyle = {} }) => (
    <div
        style={{
            position:   "relative",
            minHeight:  "100vh",
            overflow:   "hidden",
            // Deep violet base — dark enough for white text, rich enough for brand colours
            background: "linear-gradient(145deg, #12082e 0%, #1c1050 45%, #0e1a3a 100%)",
            ...extraStyle,
        }}
    >
        {/* ── dot grid — violet tint ─────────────────────────────────────── */}
        <div style={{
            position:        "absolute",
            inset:           0,
            backgroundImage: "radial-gradient(circle, rgba(97,61,228,0.22) 1.3px, transparent 1.3px)",
            backgroundSize:  "26px 26px",
            pointerEvents:   "none",
            zIndex:          0,
        }} />

        {/* ── primary violet orb — top-right ───────────────────────────── */}
        <div style={{
            position:     "absolute",
            top:          "-140px",
            right:        "-100px",
            width:        "560px",
            height:       "560px",
            borderRadius: "50%",
            background:   "radial-gradient(circle, rgba(97,61,228,0.30) 0%, transparent 65%)",
            animation:    "orbDrift 12s ease-in-out infinite",
            pointerEvents:"none",
            zIndex:        0,
        }} />

        {/* ── secondary deeper violet — bottom-left ────────────────────── */}
        <div style={{
            position:     "absolute",
            bottom:       "-130px",
            left:         "-90px",
            width:        "480px",
            height:       "480px",
            borderRadius: "50%",
            background:   "radial-gradient(circle, rgba(78,49,182,0.28) 0%, transparent 65%)",
            animation:    "orbDrift 16s ease-in-out infinite reverse",
            pointerEvents:"none",
            zIndex:        0,
        }} />

        {/* ── gold accent glow — mid-left edge ─────────────────────────── */}
        <div style={{
            position:     "absolute",
            top:          "35%",
            left:         "-60px",
            width:        "280px",
            height:       "280px",
            borderRadius: "50%",
            background:   "radial-gradient(circle, rgba(252,224,115,0.10) 0%, transparent 70%)",
            animation:    "orbDrift 20s ease-in-out infinite",
            pointerEvents:"none",
            zIndex:        0,
        }} />

        {/* ── soft central depth haze ──────────────────────────────────── */}
        <div style={{
            position:     "absolute",
            top:          "50%",
            left:         "50%",
            transform:    "translate(-50%, -50%)",
            width:        "900px",
            height:       "500px",
            borderRadius: "50%",
            background:   "radial-gradient(ellipse, rgba(97,61,228,0.08) 0%, transparent 70%)",
            pointerEvents:"none",
            zIndex:        0,
        }} />

        {/* ── page content ─────────────────────────────────────────────── */}
        <div style={{ position: "relative", zIndex: 1 }}>
            {children}
        </div>
    </div>
);

export default PageBackground;

import { ImageResponse } from "next/og";

// iOS home screen icons can't be SVG, so app/icon.svg is redrawn as a PNG. iOS rounds the corners itself.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center", background: "#0000ff" }}>
        <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M22 12h-4M6 12H2M12 6V2M12 22v-4" />
        </svg>
      </div>
    ),
    size,
  );
}

import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon: the same generic jersey as public/icon.svg, drawn larger. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#0b0f18" }}>
        <svg width="180" height="180" viewBox="0 0 64 64">
          <path d="M23 9 13 13 4 23l8 9 5-4v28h30V28l5 4 8-9-9-10-10-4c-1.6 4.6-4.9 7-9 7s-7.4-2.4-9-7z" fill="#e8442c" />
          <path d="M4 23l8 9 2.2-1.8-8.1-9.2zM60 23l-8 9-2.2-1.8 8.1-9.2z" fill="#f3b940" />
          <path d="M29.2 25.5h6.3v21.6h4.4v4.4H24.6v-4.4h4.6V31.6l-4.3 1.9v-4.9z" fill="#fff" />
        </svg>
      </div>
    ),
    size,
  );
}

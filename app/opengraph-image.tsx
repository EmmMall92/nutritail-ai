import { ImageResponse } from "next/og";
import { brand } from "@/lib/brand";

export const alt = `${brand.name} - AI pet nutrition guidance`;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f7f7f4",
          color: "#111111",
          padding: "72px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "22px",
          }}
        >
          <div
            style={{
              width: "86px",
              height: "86px",
              borderRadius: "24px",
              background: brand.colors.accent,
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "34px",
              fontWeight: 800,
            }}
          >
            NT
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: "38px", fontWeight: 800 }}>
              {brand.name}
            </div>
            <div style={{ marginTop: "6px", fontSize: "24px", color: "#4b5563" }}>
              {brand.slogan}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              maxWidth: "920px",
              fontSize: "72px",
              lineHeight: 1.02,
              fontWeight: 900,
              letterSpacing: "0",
            }}
          >
            AI pet nutrition guidance for dogs and cats
          </div>
          <div
            style={{
              marginTop: "28px",
              maxWidth: "820px",
              fontSize: "28px",
              lineHeight: 1.35,
              color: "#374151",
            }}
          >
            Calories, feeding estimates, food quality insights, and saved pet
            nutrition history.
          </div>
        </div>
      </div>
    ),
    size
  );
}

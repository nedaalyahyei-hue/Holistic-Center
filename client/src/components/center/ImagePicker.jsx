import React, { useRef, useState } from "react";
import { useLang } from "./centerLang";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_MB = 8;     // biggest file the center can choose
const MAX_CHARS = 550000;  // biggest result we keep (the server accepts up to 700000)

const readFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

// Resize the picture and save it as a JPEG. If it is still too big, lower the quality / size.
async function compress(file, maxSide) {
  const img = await loadImage(await readFile(file));
  let scale = Math.min(1, maxSide / Math.max(img.width, img.height));

  for (const quality of [0.8, 0.65, 0.5, 0.4]) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff"; // transparent PNGs get a white background
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const result = canvas.toDataURL("image/jpeg", quality);
    if (result.length <= MAX_CHARS) return result;
    scale *= 0.8;
  }
  return null;
}

export default function ImagePicker({ value, onChange, maxSide = 800, round = false }) {
  const { t } = useLang();
  const inputRef = useRef(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // lets the center choose the same file again
    if (!file) return;

    setError("");

    if (!ACCEPTED.includes(file.type)) {
      setError(t("imageNotImage"));
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(t("imageTooBig"));
      return;
    }

    setBusy(true);
    try {
      const result = await compress(file, maxSide);
      if (!result) setError(t("imageTooBig"));
      else onChange(result);
    } catch (err) {
      setError(t("imageReadError"));
    } finally {
      setBusy(false);
    }
  };

  const previewStyle = {
    width: 120,
    height: 120,
    objectFit: "cover",
    borderRadius: round ? "50%" : "12px",
    border: "2px solid #76a37b",
    background: "#f5f5f5",
  };

  return (
    <div>
      <div style={{ display: "flex", gap: "15px", alignItems: "center", flexWrap: "wrap" }}>
        {value ? (
          <img src={value} alt="" style={previewStyle} />
        ) : (
          <div
            style={{
              ...previewStyle,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              fontSize: "12px",
              color: "#888",
              borderStyle: "dashed",
              padding: "6px",
            }}
          >
            {t("noImage")}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFile}
            style={{ display: "none" }}
          />

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            style={{
              background: "#76a37b",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "10px 16px",
              fontWeight: "bold",
              cursor: busy ? "wait" : "pointer",
              opacity: busy ? 0.6 : 1,
            }}
          >
            {busy ? t("processingImage") : value ? t("changeImage") : t("chooseImage")}
          </button>

          {value && !busy && (
            <button
              type="button"
              onClick={() => onChange("")}
              style={{
                background: "none",
                border: "none",
                color: "#c0392b",
                fontWeight: "bold",
                cursor: "pointer",
                textAlign: "start",
                padding: 0,
              }}
            >
              {t("removeImage")}
            </button>
          )}
        </div>
      </div>

      <p style={{ fontSize: "12px", color: "#777", marginTop: "8px" }}>{t("imageHint")}</p>
      {error && <p style={{ color: "#c0392b", fontSize: "14px", marginTop: "4px" }}>{error}</p>}
    </div>
  );
}
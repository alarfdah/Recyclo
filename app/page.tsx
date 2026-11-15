"use client";

import { useRef, useState } from "react";
import { PLASTICS, toPublicPlastic, type PublicPlastic } from "@/lib/plastics";

type Source = "guide" | "photo" | "description";

type IdentifyResponse = {
  outcome: "result" | "pick" | "clarify";
  source: Source | null;
  plastic: PublicPlastic | null;
  message?: string;
};

const SOURCE_LABEL: Record<Source, string> = {
  guide: "From the guide",
  photo: "From your photo",
  description: "From your description",
};

export default function HomePage() {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IdentifyResponse | null>(null);

  const description = text.trim();
  const canSubmit = !busy;

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setResult(null);
    try {
      const shrunk = await shrinkImage(file);
      setImageBase64(shrunk.base64);
      setPreviewUrl(shrunk.previewUrl);
    } catch {
      setImageBase64(null);
      setPreviewUrl(null);
      setError("That photo could not be prepared. Try another picture.");
    }
  }

  function clearPhoto() {
    setImageBase64(null);
    setPreviewUrl(null);
    if (cameraRef.current) cameraRef.current.value = "";
    if (galleryRef.current) galleryRef.current.value = "";
  }

  async function identify() {
    if (!description && !imageBase64) {
      setError(null);
      setResult({
        outcome: "clarify",
        source: null,
        plastic: null,
        message:
          "Enter a description of the item (for example water bottle, milk jug, yogurt cup, or grocery bag).",
      });
      return;
    }

    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("/api/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: description || undefined,
          imageBase64: imageBase64 || undefined,
        }),
      });
      const data = (await response.json()) as IdentifyResponse & { message?: string };
      if (!response.ok) {
        const outcome = data.outcome === "clarify" || data.outcome === "pick" ? data.outcome : "clarify";
        setResult({
          outcome,
          source: null,
          plastic: null,
          message:
            data.message ||
            (outcome === "pick"
              ? "Something went wrong. Pick the number on the mark if you can see it."
              : "Enter a description of the item."),
        });
        if (outcome === "pick" && !data.message) {
          setError("Something went wrong. Pick the number on the mark if you can see it.");
        }
        return;
      }
      setResult(data);
    } catch {
      setError("Could not reach Recyclo. Try describing the item, or pick the number on the mark if you can see it.");
      setResult({ outcome: "pick", source: null, plastic: null });
    } finally {
      setBusy(false);
    }
  }

  function pickCode(code: number) {
    const plastic = PLASTICS.find((item) => item.code === code);
    if (!plastic) return;
    setError(null);
    setResult({
      outcome: "result",
      source: "guide",
      plastic: toPublicPlastic(plastic),
      message: "You picked this code.",
    });
  }

  const showPicker = result?.outcome === "pick";
  const showClarify = result?.outcome === "clarify" && Boolean(result.message);
  const plastic = result?.outcome === "result" ? result.plastic : null;

  return (
    <main className="page">
      <header className="header">
        <h1>Recyclo</h1>
        <p>Describe a plastic item to learn how to reuse or recycle it.</p>
      </header>

      <section className="panel">
        <div className="actions">
          <label htmlFor="description">
            Description
            <input
              id="description"
              type="text"
              value={text}
              placeholder="yogurt cup, plastic bag, #2"
              onChange={(event) => setText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && canSubmit) void identify();
              }}
            />
          </label>
          <p className="hint">Examples: water bottle, milk jug, yogurt cup, grocery bag, styrofoam</p>
          <button type="button" className="primary" disabled={!canSubmit} onClick={() => void identify()}>
            {busy ? "Checking…" : "Identify"}
          </button>
          <p className="or">optional photo</p>
          <button
            type="button"
            className="file-button"
            onClick={() => cameraRef.current?.click()}
            disabled={busy}
          >
            Take photo
          </button>
          <input
            ref={cameraRef}
            className="file-input"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(event) => onFile(event.target.files?.[0])}
          />
          <button
            type="button"
            className="file-button"
            onClick={() => galleryRef.current?.click()}
            disabled={busy}
          >
            Upload from gallery
          </button>
          <input
            ref={galleryRef}
            className="file-input"
            type="file"
            accept="image/*"
            onChange={(event) => onFile(event.target.files?.[0])}
          />
        </div>
        {previewUrl ? (
          <div className="preview">
            <img src={previewUrl} alt="Selected plastic" />
            <button type="button" className="text-button" onClick={clearPhoto}>
              Remove photo
            </button>
          </div>
        ) : null}
      </section>

      {error ? <p className="note">{error}</p> : null}
      {showClarify ? <p className="note">{result?.message}</p> : null}
      {result?.message && result.outcome === "pick" ? <p className="note">{result.message}</p> : null}

      {showPicker ? (
        <section className="picker">
          <h2>Pick the number inside the recycling mark</h2>
          <div className="codes">
            {PLASTICS.map((item) => (
              <button
                key={item.code}
                type="button"
                className="code-button"
                onClick={() => pickCode(item.code)}
              >
                <strong>{item.code}</strong>
                <span>{item.name}</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {plastic && result?.source ? (
        <article className="result">
          <p className="kicker">Plastic {plastic.code}</p>
          <h2>{plastic.name}</h2>
          <p className="full-name">{plastic.fullName}</p>
          <h3>What it can be used for</h3>
          <ul>
            {plastic.uses.map((use) => (
              <li key={use}>{use}</li>
            ))}
          </ul>
          <h3>Best way to recycle it</h3>
          <p>{plastic.recycle}</p>
          <p className="source">
            {SOURCE_LABEL[result.source]}
            {result.message && result.source === "guide" ? ` · ${result.message}` : ""}
          </p>
          <p className="disclaimer">
            This is general guidance. Local collection rules differ.
          </p>
        </article>
      ) : null}
    </main>
  );
}

async function shrinkImage(file: File): Promise<{ base64: string; previewUrl: string }> {
  const bitmap = await createImageBitmap(file);
  const maxEdge = 1280;
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("canvas");
  }
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (value) => (value ? resolve(value) : reject(new Error("blob"))),
      "image/jpeg",
      0.8,
    );
  });
  const previewUrl = await blobToDataUrl(blob);
  const base64 = previewUrl.split(",")[1];
  if (!base64) throw new Error("base64");
  return { base64, previewUrl };
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("read"));
    reader.readAsDataURL(blob);
  });
}

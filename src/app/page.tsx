"use client";

import { useEffect, useState } from "react";

interface GlyphMatch {
  glyph: string;
  probability: number;
}

export default function Home() {
  const [input, setInput] = useState("");
  const [glyphs, setGlyphs] = useState<GlyphMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedGlyph, setCopiedGlyph] = useState<string | null>(null);

  useEffect(() => {
    const phrase = input.trim();

    if (!phrase) {
      return;
    }

    const controller = new AbortController();

    const timeout = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/glpyhs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phrase }),
          signal: controller.signal,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error ?? "Failed to fetch glyphs.");
        }

        setGlyphs(data.glyphs ?? []);
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err.message);
          setGlyphs([]);
        }
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [input]);

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 font-sans">
      <main className="flex w-full max-w-xl flex-col items-center gap-24 px-6 pt-40 pb-16">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-black">
            glyph
          </h1>
          <p className="text-md text-zinc-600">
            Find the Unicode character you’re thinking of, powered by{" "}
            <a
              href="https://typesafe.ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:cursor-pointer"
            >
              Jev
            </a>
          </p>
        </div>

        <input
          type="text"
          value={input}
          onChange={(e) => {
            const value = e.target.value;
            setInput(value);
            if (!value.trim()) {
              setGlyphs([]);
              setError(null);
              setLoading(false);
            }
          }}
          placeholder="type something..."
          className="w-full border-b border-zinc-500 bg-transparent px-1 py-1 text-center text-base text-black outline-none placeholder:text-zinc-500 focus:border-black/50"
        />

        {loading && <p className="text-sm text-zinc-500">Searching...</p>}

        {error && <p className="text-sm text-red-500">{error}</p>}

        {!loading && glyphs.length > 0 && (
          <div className="flex w-full justify-between">
            {glyphs.map(({ glyph, probability }) => (
              <button
                key={glyph}
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(glyph);
                  setCopiedGlyph(glyph);
                  setTimeout(
                    () => setCopiedGlyph((current) => (current === glyph ? null : current)),
                    1200
                  );
                }}
                title="Click to copy"
                className="flex flex-col items-center gap-2 rounded-md p-1 transition-colors hover:bg-black/5"
              >
                <span className="text-4xl text-black">{glyph}</span>
                <span className="text-xs text-zinc-500">
                  {copiedGlyph === glyph
                    ? "Copied!"
                    : `${Math.round(probability * 100)}%`}
                </span>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

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
      <main className="flex w-full max-w-xl flex-1 flex-col gap-6 px-6 py-16 sm:py-24">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-black">
            glyph
          </h1>
          <p className="text-sm text-zinc-500">
            Find the Unicode character you’re thinking of.
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
          placeholder="Type something..."
          className="w-full border-b border-black/20 bg-transparent px-1 py-1 text-base text-black outline-none placeholder:text-zinc-400 focus:border-black/50"
        />

        {loading && <p className="text-sm text-zinc-400">Searching...</p>}

        {error && <p className="text-sm text-red-500">{error}</p>}

        {!loading && glyphs.length > 0 && (
          <div className="flex flex-wrap gap-6">
            {glyphs.map(({ glyph, probability }) => (
              <div key={glyph} className="flex flex-col items-center gap-1">
                <span className="text-3xl text-black">{glyph}</span>
                <span className="text-xs text-zinc-400">
                  {Math.round(probability * 100)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

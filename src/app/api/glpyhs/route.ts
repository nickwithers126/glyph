import { NextResponse } from "next/server";
import { glyphs } from "@/data/glyphs";

const criteria = Object.fromEntries(
  glyphs.map((glyph) => [glyph, null])
);

export async function POST(request: Request) {
  try {
    const { phrase } = await request.json();

    if (!phrase || typeof phrase !== "string") {
      return NextResponse.json(
        { error: "Phrase is required." },
        { status: 400 }
      );
    }

    const response = await fetch(
      "https://api.typesafe.ai/v1/systemone",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.TYPESAFE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          state: phrase,
          model: "jev-latest",
          questions: {
            glyph_match: {
              type: "choice",
              instructions:
                "Which Unicode character best matches the user's phrase, concept, object, emotion, action, direction, or vibe?",
              criteria,
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();

      console.error("TypeSafe error:", error);

      return NextResponse.json(
        { error: "Failed to rank glyphs." },
        { status: 500 }
      );
    }

    const data = await response.json();

    const probabilities =
      data.answers.glyph_match.probabilities;

    const topGlyphs = Object.entries(probabilities)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([glyph, probability]) => ({
        glyph,
        probability,
      }));

    return NextResponse.json({
      glyphs: topGlyphs,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
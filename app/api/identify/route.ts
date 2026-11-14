import { openai } from "@ai-sdk/openai";
import { APICallError, generateText, Output } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getPlastic,
  matchPlastic,
  toPublicPlastic,
  type PublicPlastic,
} from "@/lib/plastics";

export const runtime = "nodejs";

const MAX_TEXT = 500;
const MAX_BASE64_CHARS = 2_800_000;

type Source = "guide" | "photo" | "description";

type Body = {
  text?: unknown;
  imageBase64?: unknown;
};

type AiIdentification = {
  resinCode?: number | null;
  unsure?: boolean;
  notPlastic?: boolean;
};

const identificationSchema = z.object({
  resinCode: z
    .number()
    .int()
    .min(1)
    .max(7)
    .nullable()
    .describe("Resin identification code 1–7, or null if unknown"),
  unsure: z.boolean().describe("True when the plastic type is ambiguous"),
  notPlastic: z.boolean().describe("True when the item is not plastic"),
});

function result(plastic: PublicPlastic, source: Source, message?: string) {
  return NextResponse.json({
    outcome: "result",
    source,
    plastic,
    message,
  });
}

function pick(message: string, status = 200) {
  return NextResponse.json(
    { outcome: "pick", source: null, plastic: null, message },
    { status },
  );
}

function readImage(imageBase64: string): { mimeType: string; data: string } | null {
  const trimmed = imageBase64.trim();
  const dataUrl = trimmed.match(/^data:(image\/[a-z0-9.+-]+);base64,([a-z0-9+/=\s]+)$/i);
  const data = (dataUrl ? dataUrl[2] : trimmed).replace(/\s/g, "");
  if (!data || data.length > MAX_BASE64_CHARS) return null;
  if (!/^[a-z0-9+/]+={0,2}$/i.test(data)) return null;

  let bytes: Buffer;
  try {
    bytes = Buffer.from(data, "base64");
  } catch {
    return null;
  }
  if (bytes.length === 0 || bytes.length > 2 * 1024 * 1024) return null;

  const mimeType = sniffMime(bytes);
  if (!mimeType) return null;
  return { mimeType, data };
}

function sniffMime(bytes: Buffer): string | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return "image/png";
  }
  if (bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP") {
    return "image/webp";
  }
  if (bytes.subarray(0, 4).toString("ascii") === "GIF8") return "image/gif";
  return null;
}

function identifyFailureMessage(error: unknown): string {
  const status = APICallError.isInstance(error)
    ? error.statusCode
    : typeof error === "object" && error && "statusCode" in error
      ? Number((error as { statusCode?: unknown }).statusCode)
      : typeof error === "object" && error && "status" in error
        ? Number((error as { status?: unknown }).status)
        : NaN;
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : "";
  const lower = message.toLowerCase();

  if (
    status === 401 ||
    status === 403 ||
    lower.includes("api key") ||
    lower.includes("permission") ||
    lower.includes("unauthorized") ||
    lower.includes("forbidden") ||
    lower.includes("incorrect api key") ||
    lower.includes("invalid_api_key")
  ) {
    return "Photo reading could not authenticate with OpenAI. Check OPENAI_API_KEY in .env.local, then restart the server. Or pick the number inside the recycling mark.";
  }

  if (
    status === 429 ||
    status === 503 ||
    lower.includes("rate limit") ||
    lower.includes("overloaded") ||
    lower.includes("unavailable") ||
    lower.includes("high demand") ||
    lower.includes("try again later")
  ) {
    return "Photo reading is busy right now. Try again in a moment, or pick the number inside the recycling mark.";
  }

  return "That could not be checked. Pick the number inside the recycling mark.";
}

function isProviderBusy(error: unknown): boolean {
  const status = APICallError.isInstance(error)
    ? error.statusCode
    : typeof error === "object" && error && "statusCode" in error
      ? Number((error as { statusCode?: unknown }).statusCode)
      : typeof error === "object" && error && "status" in error
        ? Number((error as { status?: unknown }).status)
        : NaN;
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : "";
  const lower = message.toLowerCase();
  return (
    status === 429 ||
    status === 503 ||
    lower.includes("rate limit") ||
    lower.includes("overloaded") ||
    lower.includes("unavailable") ||
    lower.includes("high demand") ||
    lower.includes("try again later")
  );
}

async function identifyWithOpenAI(
  text: string | undefined,
  image: { mimeType: string; data: string } | undefined,
): Promise<AiIdentification> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("missing key");

  const prompt = [
    "Identify the household plastic in the user's photo and/or description.",
    "Return structured fields only.",
    "resinCode is the resin identification code from 1 to 7 when you can tell, otherwise null.",
    "If a chasing-arrows number is visible, use that number.",
    "Use a common item only when the type is obvious: clear drink bottle = 1, milk jug = 2, plastic shopping bag = 4, foam cup = 6.",
    "If it could be several types, set unsure to true and resinCode to null.",
    "Set notPlastic to true when the item is not plastic.",
    text ? `Description: ${text}` : "No description was provided.",
  ].join(" ");

  const content: Array<
    { type: "text"; text: string } | { type: "file"; mediaType: string; data: string }
  > = [{ type: "text", text: prompt }];
  if (image) {
    content.push({
      type: "file",
      mediaType: image.mimeType,
      data: image.data,
    });
  }

  const generate = () =>
    generateText({
      model: openai("gpt-4o-mini"),
      temperature: 0,
      messages: [{ role: "user", content }],
      output: Output.object({
        schema: identificationSchema,
      }),
    });

  let response;
  try {
    response = await generate();
  } catch (error) {
    if (!isProviderBusy(error)) throw error;
    await new Promise((resolve) => setTimeout(resolve, 800));
    response = await generate();
  }

  const identified = response.output;
  if (!identified) throw new Error("empty model response");
  return identified;
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return pick("Send a description or a photo.", 400);
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (text.length > MAX_TEXT) {
    return pick("Use a shorter description.", 400);
  }

  let image: { mimeType: string; data: string } | undefined;
  if (typeof body.imageBase64 === "string" && body.imageBase64.trim()) {
    if (body.imageBase64.length > MAX_BASE64_CHARS) {
      return pick("That photo is too large. Take a closer, smaller shot.", 413);
    }
    const parsed = readImage(body.imageBase64);
    if (!parsed) return pick("That photo could not be read. Use a JPEG or PNG.", 400);
    image = parsed;
  }

  if (!text && !image) {
    return pick("Add a photo or a short description.", 400);
  }

  if (!image) {
    const matched = matchPlastic(text);
    if (matched) return result(toPublicPlastic(matched), "guide");
  }

  if (!process.env.OPENAI_API_KEY?.trim()) {
    return pick(
      image
        ? "Photo reading needs an API key. Pick the number inside the recycling mark."
        : "That description is not in the guide. Pick the number inside the recycling mark.",
    );
  }

  try {
    const identified = await identifyWithOpenAI(text || undefined, image);
    if (identified.notPlastic) {
      return pick("That does not look like plastic. If it is, pick the number inside the recycling mark.");
    }
    const code = identified.resinCode;
    const plastic = typeof code === "number" ? getPlastic(code) : undefined;
    if (identified.unsure || !plastic) {
      return pick("The type is unclear. Pick the number inside the recycling mark.");
    }
    return result(toPublicPlastic(plastic), image ? "photo" : "description");
  } catch (error) {
    console.error("[identify] OpenAI failed:", error instanceof Error ? error.message : error);
    return pick(identifyFailureMessage(error));
  }
}

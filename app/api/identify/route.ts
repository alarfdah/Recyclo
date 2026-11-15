import { openai } from "@ai-sdk/openai";
import { APICallError, generateText, Output } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getPlastic,
  matchDescription,
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

function clarify(message: string, status = 200) {
  return NextResponse.json(
    { outcome: "clarify", source: null, plastic: null, message },
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

function errorDetails(error: unknown): { status: number; lower: string } {
  const status = APICallError.isInstance(error)
    ? Number(error.statusCode)
    : typeof error === "object" && error && "statusCode" in error
      ? Number((error as { statusCode?: unknown }).statusCode)
      : typeof error === "object" && error && "status" in error
        ? Number((error as { status?: unknown }).status)
        : NaN;
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : "";
  return { status, lower: message.toLowerCase() };
}

function isBillingOrQuotaError(error: unknown): boolean {
  const { lower } = errorDetails(error);
  return (
    lower.includes("no credits") ||
    lower.includes("credit balance") ||
    lower.includes("insufficient_quota") ||
    lower.includes("insufficient quota") ||
    lower.includes("billing") ||
    lower.includes("payment required") ||
    lower.includes("exceeded your current quota") ||
    lower.includes("add credits")
  );
}

function identifyFailureMessage(error: unknown): string {
  const { status, lower } = errorDetails(error);

  if (
    status === 401 ||
    status === 403 ||
    lower.includes("api key") ||
    lower.includes("missing key") ||
    lower.includes("permission") ||
    lower.includes("unauthorized") ||
    lower.includes("forbidden") ||
    lower.includes("incorrect api key") ||
    lower.includes("invalid_api_key")
  ) {
    return "Photo reading could not authenticate with OpenAI. Check OPENAI_API_KEY in .env.local, then restart the server. Or pick the number inside the recycling mark.";
  }

  if (isBillingOrQuotaError(error) || status === 402) {
    return "Photo reading needs OpenAI credits. Add billing credits at platform.openai.com, then try again. Or pick the number inside the recycling mark.";
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
  if (isBillingOrQuotaError(error)) return false;
  const { status, lower } = errorDetails(error);
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
    return clarify("Enter a description of the item (for example water bottle or yogurt cup).", 400);
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (text.length > MAX_TEXT) {
    return clarify("Use a shorter description.", 400);
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

  // Description-first: empty input must not dump users into the number picker.
  if (!text && !image) {
    return clarify(
      "Enter a description of the item (for example water bottle, milk jug, yogurt cup, or grocery bag).",
      400,
    );
  }

  if (text) {
    const matched = matchDescription(text);
    if (matched.status === "matched") {
      return result(toPublicPlastic(matched.plastic), "guide");
    }
    // Description-only: guide match drives the answer; clarify instead of pick.
    if (!image) {
      if (matched.status === "ambiguous") {
        return clarify(matched.message);
      }
      return clarify(matched.message);
    }
    // Photo + unmatched/ambiguous text: keep going to vision; text alone was not enough.
  }

  if (!image) {
    return clarify(
      "Enter a description of the item (for example water bottle, milk jug, yogurt cup, or grocery bag).",
    );
  }

  if (!process.env.OPENAI_API_KEY?.trim()) {
    return pick(
      "Photo reading needs an API key. Describe the item instead, or pick the number inside the recycling mark.",
    );
  }

  try {
    const identified = await identifyWithOpenAI(text || undefined, image);
    if (identified.notPlastic) {
      return clarify(
        "That does not look like plastic. Describe the plastic item, or pick the number inside the recycling mark if you can see it.",
      );
    }
    const code = identified.resinCode;
    const plastic = typeof code === "number" ? getPlastic(code) : undefined;
    if (identified.unsure || !plastic) {
      return pick(
        text
          ? "The photo is unclear and the description did not match the guide. Pick the number inside the recycling mark, or try a clearer item name."
          : "The type is unclear from the photo. Add a short description, or pick the number inside the recycling mark.",
      );
    }
    return result(toPublicPlastic(plastic), "photo");
  } catch (error) {
    console.error("[identify] OpenAI failed:", error instanceof Error ? error.message : error);
    return pick(identifyFailureMessage(error));
  }
}

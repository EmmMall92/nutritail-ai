import "server-only";

import OpenAI from "openai";

const DEFAULT_OPENAI_MODEL = "gpt-4.1-mini";

let cachedClient: OpenAI | null = null;

export function getOpenAiModel() {
  return process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL;
}

export function isOpenAiConfigured() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function getOpenAiClient() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) return null;

  if (!cachedClient) {
    cachedClient = new OpenAI({ apiKey });
  }

  return cachedClient;
}

import { GoogleGenerativeAI } from "@google/generative-ai";

export interface ParsedReceipt {
  merchantName: string;
  totalAmount: number;
  date: string | null;
  subtotal: number | null;
  taxAmount: number | null;
  lineItems: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  suggestedCategoryId: string | null;
  suggestedCategoryName: string | null;
}

let _genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!_genAI) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not set in environment variables");
    }
    _genAI = new GoogleGenerativeAI(key);
  }
  return _genAI;
}

export async function parseReceipt(
  base64Image: string,
  mimeType: string,
  categories: { id: string; name: string }[]
): Promise<ParsedReceipt> {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      // @ts-expect-error -- thinkingConfig is supported by 2.5 models but not yet in SDK types
      thinkingConfig: { thinkingBudget: 0 },
    },
  });

  const categoryList = categories
    .map((c) => `- "${c.name}" (id: ${c.id})`)
    .join("\n");

  const prompt = `Parse this receipt image. Extract the merchant name, total amount, date, tax, and line items.

This receipt is from a construction project with these budget categories:
${categoryList}

Based on the merchant and items purchased, suggest which budget category this expense most likely belongs to.

Return ONLY valid JSON with no markdown formatting, no code blocks, no backticks:
{
  "merchantName": "string",
  "totalAmount": 0.00,
  "date": "YYYY-MM-DD or null",
  "subtotal": 0.00,
  "taxAmount": 0.00,
  "lineItems": [{ "description": "string", "quantity": 1, "unitPrice": 0.00, "total": 0.00 }],
  "suggestedCategoryId": "category id or null",
  "suggestedCategoryName": "category name or null"
}`;

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        mimeType,
        data: base64Image,
      },
    },
  ]);

  const text = result.response.text().trim();

  // Strip any markdown code block wrapping
  const jsonStr = text.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");

  try {
    const parsed = JSON.parse(jsonStr) as ParsedReceipt;
    return {
      merchantName: parsed.merchantName ?? "Unknown Merchant",
      totalAmount: Number(parsed.totalAmount) || 0,
      date: parsed.date ?? null,
      subtotal: parsed.subtotal != null ? Number(parsed.subtotal) : null,
      taxAmount: parsed.taxAmount != null ? Number(parsed.taxAmount) : null,
      lineItems: Array.isArray(parsed.lineItems)
        ? parsed.lineItems.map((item) => ({
            description: String(item.description ?? ""),
            quantity: Number(item.quantity) || 1,
            unitPrice: Number(item.unitPrice) || 0,
            total: Number(item.total) || 0,
          }))
        : [],
      suggestedCategoryId: parsed.suggestedCategoryId ?? null,
      suggestedCategoryName: parsed.suggestedCategoryName ?? null,
    };
  } catch {
    console.error("[parseReceipt] Failed to parse Gemini response:", text);
    throw new Error("Failed to parse receipt data from AI response");
  }
}

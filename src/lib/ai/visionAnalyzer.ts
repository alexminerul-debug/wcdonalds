import type { AnomalyTrait, VisionAnalysisResult } from "../../shared/types";

export async function analyzeSnapshot(
  base64Jpeg: string,
  assignedTraits: AnomalyTrait[],
  apiKey: string
): Promise<VisionAnalysisResult> {
  const models = [
    "google/gemini-2.0-flash-lite:free",
    "qwen/qwen-2.5-vl-72b-instruct:free",
    "meta-llama/llama-3.2-11b-vision-instruct:free",
  ];

  const traitDescriptions = assignedTraits
    .map((t) => `- ID: "${t.id}" — ${t.aiPrompt}`)
    .join("\n");

  const systemPrompt = `You are an AI CCTV analysis system designed to detect subtle visual anomalies in a fast-food restaurant environment.
You must analyze the provided camera frame and determine if any of the following specific anomalies are present.
Respond ONLY with a valid JSON object (no markdown, no backticks, no commentary):
{
  "observedPerson": boolean,
  "facialExpression": "string description",
  "headTiltDetected": boolean,
  "unnaturalSmile": boolean,
  "frozenOrMotionless": boolean,
  "headTilted": boolean,
  "tappingOrFidgeting": boolean,
  "lookingAtCeiling": boolean,
  "detectedTraits": ["trait_id_1", "trait_id_2"],
  "confidenceScore": number between 0 and 1
}

Only include a trait_id in detectedTraits if you are at least 60% confident the person is exhibiting that specific behavior.
If no person is visible, set observedPerson to false and detectedTraits to [].

Anomalies to look for:
${traitDescriptions}
`;

  let attempt = 0;
  const maxAttempts = 3;
  let delay = 1000;

  while (attempt < maxAttempts) {
    try {
      const imageUrl = base64Jpeg.startsWith("data:")
        ? base64Jpeg
        : `data:image/jpeg;base64,${base64Jpeg}`;

      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://wcdonalds-anomaly.pages.dev",
            "X-Title": "WcDonalds Anomaly CCTV",
          },
          body: JSON.stringify({
            models,
            response_format: { type: "json_object" },
            temperature: 0.1,
            max_tokens: 1000,
            messages: [
              { role: "system", content: systemPrompt },
              {
                role: "user",
                content: [
                  {
                    type: "image_url",
                    image_url: { url: imageUrl },
                  },
                  {
                    type: "text",
                    text: "Analyze this CCTV frame for the specific anomalies listed.",
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429 || response.status === 503) {
          throw new Error(`Rate limited or unavailable: ${response.status}`);
        }
        throw new Error(`API Error: ${response.status}`);
      }

      const data = (await response.json()) as {
        choices: Array<{ message: { content: string } }>;
      };
      const textResponse = data.choices?.[0]?.message?.content || "{}";

      // Strip markdown code fences if present
      const jsonString = textResponse
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      const parsed = JSON.parse(jsonString);

      const matched = matchDetectedTraits(
        parsed.detectedTraits || [],
        assignedTraits
      );

      return {
        observedPerson: parsed.observedPerson ?? false,
        facialExpression: parsed.facialExpression ?? "",
        headTiltDetected: parsed.headTiltDetected ?? false,
        unnaturalSmile: parsed.unnaturalSmile ?? false,
        frozenOrMotionless: parsed.frozenOrMotionless ?? false,
        headTilted: parsed.headTilted ?? false,
        tappingOrFidgeting: parsed.tappingOrFidgeting ?? false,
        lookingAtCeiling: parsed.lookingAtCeiling ?? false,
        detectedTraits: matched,
        confidenceScore: parsed.confidenceScore ?? 0,
      };
    } catch (error) {
      attempt++;
      if (attempt >= maxAttempts) {
        console.error("Vision analysis failed after retries:", error);
        return {
          observedPerson: false,
          facialExpression: "",
          headTiltDetected: false,
          unnaturalSmile: false,
          frozenOrMotionless: false,
          headTilted: false,
          tappingOrFidgeting: false,
          lookingAtCeiling: false,
          detectedTraits: [],
          confidenceScore: 0,
        };
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    }
  }

  return {
    observedPerson: false,
    facialExpression: "",
    headTiltDetected: false,
    unnaturalSmile: false,
    frozenOrMotionless: false,
    headTilted: false,
    tappingOrFidgeting: false,
    lookingAtCeiling: false,
    detectedTraits: [],
    confidenceScore: 0,
  };
}

function matchDetectedTraits(
  detectedIds: unknown[],
  assignedTraits: AnomalyTrait[]
): string[] {
  const result: string[] = [];
  if (!Array.isArray(detectedIds)) return result;

  const validIds = new Set(assignedTraits.map((t) => t.id));
  for (const id of detectedIds) {
    if (typeof id === "string" && validIds.has(id)) {
      result.push(id);
    }
  }
  return result;
}

import { useState, useRef, useEffect } from "react";
import { X, Camera, Sparkles, CheckCircle2, XCircle, RefreshCw, Key, ChevronRight } from "lucide-react";
import { safeStorage } from "@/lib/storage";

interface Task {
  id: string;
  title: string;
  category: "facial" | "postural" | "gestural" | "behavioral";
  instructions: string;
  aiPrompt: string;
}

const TASKS: Task[] = [
  {
    id: "unnatural-grin",
    title: "1. Unnatural Wide Grin",
    category: "facial",
    instructions: "Look directly at the camera and make an unnaturally wide, exaggerated grin/smile.",
    aiPrompt: "The person has an exaggerated, unnaturally wide smile or grin that looks forced and creepy",
  },
  {
    id: "dead-stare",
    title: "2. Blank Dead Stare",
    category: "facial",
    instructions: "Stare directly into the lens with a completely blank, emotionless, frozen face.",
    aiPrompt: "The person is staring directly at the camera with a flat, blank, emotionless expression",
  },
  {
    id: "no-blink",
    title: "3. Wide Open Eyes (No Blink)",
    category: "facial",
    instructions: "Open your eyes as wide as possible, staring intensely without blinking.",
    aiPrompt: "The person's eyes appear unnaturally wide open without blinking, staring intensely",
  },
  {
    id: "slow-blink",
    title: "4. Slow Motion Blink",
    category: "facial",
    instructions: "Keep your eyes half-closed or closing slowly as if in slow motion.",
    aiPrompt: "The person's eyes are half-closed or closing very slowly, as if blinking in extreme slow motion",
  },
  {
    id: "head-tilt-left",
    title: "5. Head Tilt Left",
    category: "postural",
    instructions: "Tilt your head sharply 45 degrees towards your left shoulder.",
    aiPrompt: "The person's head is significantly tilted to their left side at approximately 45 degrees",
  },
  {
    id: "look-ceiling",
    title: "6. Staring at Ceiling",
    category: "postural",
    instructions: "Tilt your head backwards and stare directly up toward the ceiling.",
    aiPrompt: "The person is looking upward toward the ceiling with their head tilted back",
  },
  {
    id: "lean-forward",
    title: "7. Leaning Uncomfortably Close",
    category: "postural",
    instructions: "Lean your face very close toward the camera lens.",
    aiPrompt: "The person is leaning forward significantly, appearing very close to the camera",
  },
  {
    id: "point-camera",
    title: "8. Point at Camera",
    category: "gestural",
    instructions: "Raise your index finger and point directly toward the camera lens.",
    aiPrompt: "The person is pointing their finger directly toward the camera",
  },
  {
    id: "wave-slow",
    title: "9. Creepy Slow Wave",
    category: "gestural",
    instructions: "Hold up your hand next to your face and wave toward the camera very slowly.",
    aiPrompt: "The person is performing a slow, deliberate wave gesture",
  },
  {
    id: "cover-mouth",
    title: "10. Hand Covering Mouth",
    category: "behavioral",
    instructions: "Place your whole hand over your mouth while staring forward.",
    aiPrompt: "The person has their hand covering or partially covering their mouth",
  },
];

const TARGET_MODEL = "google/gemma-4-26b-a4b-it:free";

interface AIVisionTestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIVisionTestModal({ isOpen, onClose }: AIVisionTestModalProps) {
  const [selectedTaskIndex, setSelectedTaskIndex] = useState(0);
  const [apiKey, setApiKey] = useState(() => safeStorage.getItem("wcd_openrouter_key") || "");
  const [cameraActive, setCameraActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [rawResponse, setRawResponse] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const currentTask = TASKS[selectedTaskIndex];

  // Initialize camera when modal opens
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setCapturedImage(null);
      setAnalysisResult(null);
      setRawResponse(null);
      setErrorMsg(null);
    }
  }, [isOpen]);

  const startCamera = async () => {
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);
    } catch (err: any) {
      setErrorMsg("Camera permission denied or camera not found: " + (err?.message || ""));
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleApiKeyChange = (val: string) => {
    setApiKey(val);
    safeStorage.setItem("wcd_openrouter_key", val.trim());
  };

  const captureFrame = (): string | null => {
    if (!videoRef.current) return null;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.85);
  };

  const runTest = async () => {
    if (!apiKey.trim()) {
      setErrorMsg("Please enter an OpenRouter API Key below to test the AI Vision model.");
      return;
    }

    const frame = captureFrame();
    if (!frame) {
      setErrorMsg("Failed to capture image from camera.");
      return;
    }

    setCapturedImage(frame);
    setIsAnalyzing(true);
    setErrorMsg(null);
    setAnalysisResult(null);
    setRawResponse(null);

    const systemPrompt = `You are an AI CCTV analysis system designed to detect subtle visual anomalies in a fast-food restaurant environment.
You must analyze the provided camera frame and determine if the person exhibits the following specific anomaly:
- Task: "${currentTask.title}"
- Trait ID: "${currentTask.id}"
- Behavior criteria: "${currentTask.aiPrompt}"

Respond ONLY with a valid JSON object (no markdown, no backticks, no commentary):
{
  "observedPerson": boolean,
  "facialExpression": "string description",
  "taskDetected": boolean,
  "detectedTraits": ["${currentTask.id}" or empty []],
  "confidenceScore": number between 0 and 1,
  "explanation": "short 1-sentence reason"
}`;

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://wcdonalds-anomaly.pages.dev",
          "X-Title": "WcDonalds Anomaly Vision Test",
        },
        body: JSON.stringify({
          model: TARGET_MODEL,
          temperature: 0.1,
          max_tokens: 600,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                { type: "text", text: `Analyze if the person in this photo is performing: ${currentTask.title}.` },
                {
                  type: "image_url",
                  image_url: { url: frame },
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`OpenRouter Error ${response.status}: ${errorBody}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "{}";
      setRawResponse(content);

      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);
      setAnalysisResult(parsed);
    } catch (err: any) {
      setErrorMsg(err?.message || "Unknown error during AI vision analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md font-mono select-none">
      <div className="w-full max-w-4xl bg-void border border-smoke/50 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-abyss border-b border-smoke/40">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-glow animate-pulse" />
            <span className="text-bone font-bold text-sm tracking-wider">AI VISION TEST BENCH</span>
            <span className="text-[10px] bg-blood/30 text-blood-bright px-2 py-0.5 rounded border border-blood/40">
              {TARGET_MODEL}
            </span>
          </div>
          <button onClick={onClose} className="text-fog hover:text-bone p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar">
          {/* Top API Key Config */}
          <div className="bg-abyss/80 border border-smoke/30 p-3 rounded-lg flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-bone shrink-0">
              <Key className="w-4 h-4 text-amber-glow" />
              <span>OpenRouter Key:</span>
            </div>
            <input
              type="password"
              placeholder="sk-or-v1-..."
              value={apiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              className="flex-1 w-full bg-void border border-smoke/40 text-bone text-xs px-3 py-1.5 rounded focus:outline-none focus:border-amber-glow"
            />
            <span className="text-[10px] text-fog/60 shrink-0">Saved locally in browser</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Task Selector (Left column) */}
            <div className="md:col-span-4 bg-abyss/60 border border-smoke/30 rounded-lg p-2 space-y-1 max-h-72 md:max-h-96 overflow-y-auto custom-scrollbar">
              <div className="text-xs uppercase text-fog tracking-widest px-2 py-1 font-bold">10 Test Tasks</div>
              {TASKS.map((task, idx) => {
                const isSelected = selectedTaskIndex === idx;
                return (
                  <button
                    key={task.id}
                    onClick={() => {
                      setSelectedTaskIndex(idx);
                      setAnalysisResult(null);
                      setCapturedImage(null);
                      setErrorMsg(null);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded text-xs transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? "bg-blood/30 border border-blood text-bone font-bold"
                        : "text-fog/70 hover:bg-void hover:text-bone"
                    }`}
                  >
                    <span className="truncate">{task.title}</span>
                    <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-blood-bright" : "opacity-30"}`} />
                  </button>
                );
              })}
            </div>

            {/* Camera & Task Prompt (Right column) */}
            <div className="md:col-span-8 flex flex-col space-y-3">
              {/* Task Details Card */}
              <div className="bg-void border border-smoke/40 rounded-lg p-3">
                <div className="text-xs text-amber-glow uppercase font-bold tracking-wider">
                  Active Task: {currentTask.title}
                </div>
                <div className="text-sm text-bone mt-1">{currentTask.instructions}</div>
                <div className="text-[11px] text-fog/60 mt-1 font-mono">
                  Prompt: <span className="text-fog">{currentTask.aiPrompt}</span>
                </div>
              </div>

              {/* Camera Preview Box */}
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-smoke/40 flex items-center justify-center">
                {/* Live Video */}
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  autoPlay
                  className={`w-full h-full object-cover ${capturedImage ? "hidden" : "block"}`}
                />

                {/* Frozen captured preview */}
                {capturedImage && (
                  <img src={capturedImage} alt="Captured frame" className="w-full h-full object-cover" />
                )}

                {/* Overlay Scanning Guide */}
                <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-amber-glow/20 rounded-lg m-4" />

                {/* Target Model Watermark */}
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 text-[10px] text-amber-glow border border-smoke/30 rounded">
                  MODEL: {TARGET_MODEL}
                </div>

                {!cameraActive && !capturedImage && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-4 text-center">
                    <Camera className="w-8 h-8 text-fog mb-2" />
                    <span className="text-xs text-fog">Camera feed inactive</span>
                    <button
                      onClick={startCamera}
                      className="mt-3 px-3 py-1.5 bg-blood/30 border border-blood text-bone text-xs rounded uppercase hover:bg-blood/50"
                    >
                      Start Camera
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={runTest}
                  disabled={isAnalyzing || !cameraActive}
                  className="flex-1 py-3 px-4 bg-blood hover:bg-blood-bright text-bone text-xs md:text-sm font-bold uppercase tracking-wider rounded-lg shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Analyzing with {TARGET_MODEL}...
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      Capture Frame & Test Model
                    </>
                  )}
                </button>

                {capturedImage && (
                  <button
                    type="button"
                    onClick={() => {
                      setCapturedImage(null);
                      setAnalysisResult(null);
                    }}
                    className="py-3 px-3 bg-void border border-smoke/40 text-fog hover:text-bone text-xs rounded-lg cursor-pointer"
                    title="Retake live stream"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3 bg-blood/20 border border-blood text-blood-bright text-xs rounded-lg">
                  ⚠️ {errorMsg}
                </div>
              )}

              {/* Result Card */}
              {analysisResult && (
                <div className="p-4 bg-abyss border border-smoke/40 rounded-lg space-y-2">
                  <div className="flex items-center justify-between border-b border-smoke/20 pb-2">
                    <span className="text-xs uppercase text-bone font-bold">AI Analysis Result</span>
                    <div className="flex items-center gap-1.5">
                      {analysisResult.taskDetected || (analysisResult.detectedTraits && analysisResult.detectedTraits.includes(currentTask.id)) ? (
                        <div className="flex items-center gap-1 text-safe font-bold text-xs uppercase bg-safe/10 border border-safe/30 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>ANOMALY DETECTED!</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-fog font-bold text-xs uppercase bg-void border border-smoke/30 px-2 py-0.5 rounded">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>NOT DETECTED</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-fog">
                      Person Observed: <span className="text-bone">{analysisResult.observedPerson ? "YES" : "NO"}</span>
                    </div>
                    <div className="text-fog">
                      Confidence:{" "}
                      <span className="text-amber-glow font-bold">
                        {Math.round((analysisResult.confidenceScore || 0) * 100)}%
                      </span>
                    </div>
                    <div className="col-span-2 text-fog">
                      Expression: <span className="text-bone">{analysisResult.facialExpression || "N/A"}</span>
                    </div>
                    {analysisResult.explanation && (
                      <div className="col-span-2 text-fog">
                        Reason: <span className="text-bone italic">{analysisResult.explanation}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Raw JSON Debug toggle */}
              {rawResponse && (
                <details className="text-[10px] text-fog/60 bg-void p-2 rounded border border-smoke/20">
                  <summary className="cursor-pointer uppercase tracking-wider">Show Raw Model JSON</summary>
                  <pre className="mt-2 text-fog overflow-x-auto whitespace-pre-wrap">{rawResponse}</pre>
                </details>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

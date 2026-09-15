"use client";

import { useEffect, useRef, useState } from "react";
import { codeFromScanPayload } from "@/lib/verification-code";

type Detector = {
  detect: (source: ImageBitmapSource) => Promise<{ rawValue: string }[]>;
};

export default function VerifyForm({ defaultCode }: { defaultCode: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const [scanning, setScanning] = useState(false);
  const [hint, setHint] = useState("");

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [defaultCode]);

  useEffect(() => {
    return () => stopScan();
  }, []);

  function go(code: string) {
    const next = codeFromScanPayload(code);
    if (!next) return;
    stopScan();
    window.location.assign(`/verify?code=${encodeURIComponent(next)}`);
  }

  function stopScan() {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  }

  async function startScan() {
    const DetectorCtor = (window as unknown as { BarcodeDetector?: new (opts: { formats: string[] }) => Detector }).BarcodeDetector;
    if (!DetectorCtor || !navigator.mediaDevices?.getUserMedia) {
      setHint("On a phone, open the camera and scan the QR next to the barcode. Or type the code printed under the bars.");
      inputRef.current?.focus();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      setScanning(true);
      setHint("");
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();
      const detector = new DetectorCtor({ formats: ["code_128", "qr_code"] });
      timerRef.current = window.setInterval(async () => {
        try {
          const found = await detector.detect(video);
          const raw = found[0]?.rawValue;
          if (raw) go(raw);
        } catch {
          /* keep scanning */
        }
      }, 250);
    } catch {
      setHint("Camera permission was denied. Type the code printed under the barcode, or scan the QR with your phone camera.");
      setScanning(false);
    }
  }

  return (
    <div>
      <form
        method="get"
        action="/verify"
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          const code = String(new FormData(e.currentTarget).get("code") ?? "");
          const next = codeFromScanPayload(code);
          if (!next) return;
          e.preventDefault();
          go(next);
        }}
      >
        <input
          ref={inputRef}
          name="code"
          defaultValue={defaultCode}
          placeholder="Scan or type the code"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="characters"
          spellCheck={false}
          inputMode="text"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-3 text-base uppercase tracking-wide"
          aria-label="Report card verification code"
        />
        <div className="flex gap-2">
          <button type="submit" className="flex-1 rounded-lg bg-[#0C2A5A] px-4 py-3 text-white sm:flex-none">
            Check
          </button>
          <button
            type="button"
            onClick={scanning ? stopScan : startScan}
            className="flex-1 rounded-lg border border-[#0C2A5A] px-4 py-3 text-[#0C2A5A] sm:flex-none"
          >
            {scanning ? "Stop camera" : "Scan"}
          </button>
        </div>
      </form>
      {scanning ? (
        <video ref={videoRef} className="mt-3 w-full rounded-lg bg-black" playsInline muted autoPlay />
      ) : (
        <video ref={videoRef} className="hidden" playsInline muted />
      )}
      {hint ? <p className="mt-3 text-sm text-slate-600">{hint}</p> : null}
      <p className="mt-3 text-xs text-slate-500">
        Office barcode gun: click the box, then scan. Phone: scan the QR, or type the code under the bars if the scan fails.
      </p>
    </div>
  );
}

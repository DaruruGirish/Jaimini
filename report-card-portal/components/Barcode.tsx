"use client";

import { useEffect, useRef, useState } from "react";
import JsBarcode from "jsbarcode";
import QRCode from "qrcode";
import { isSafeVerificationCode, verifyUrl } from "@/lib/verification-code";

export default function Barcode({ value }: { value: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [qr, setQr] = useState("");

  useEffect(() => {
    if (!svgRef.current || !isSafeVerificationCode(value)) return;
    JsBarcode(svgRef.current, value, {
      format: "CODE128",
      displayValue: false,
      margin: 4,
      height: 36,
      width: 1.5,
      background: "#ffffff",
      lineColor: "#111111",
    });
  }, [value]);

  useEffect(() => {
    if (!isSafeVerificationCode(value) || typeof window === "undefined") return;
    QRCode.toDataURL(verifyUrl(window.location.origin, value), {
      margin: 0,
      width: 72,
      errorCorrectionLevel: "M",
      color: { dark: "#111111", light: "#ffffff" },
    })
      .then(setQr)
      .catch(() => setQr(""));
  }, [value]);

  if (!isSafeVerificationCode(value)) return null;

  return (
    <div className="rc-barcode">
      <div className="rc-barcode-codes">
        {qr ? <img className="rc-qr" src={qr} alt="" /> : null}
        <div className="rc-code128">
          <svg ref={svgRef} />
          <div className="rc-barcode-text">{value}</div>
        </div>
      </div>
    </div>
  );
}

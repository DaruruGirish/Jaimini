/** School code + year + class + section + padded roll. Never a roll number alone. */

export function yearSuffix(label: string) {
  const m = label.match(/(\d{4})\s*[-–]\s*(\d{2,4})/);
  if (!m) return label.replace(/\D/g, "").slice(-2).padStart(2, "0") || "00";
  const end = m[2].length === 4 ? m[2].slice(-2) : m[2];
  return end.padStart(2, "0");
}

export function alnumUpper(value: string) {
  return value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

export function normalizeVerificationCode(raw: string) {
  return alnumUpper(raw.trim());
}

export function paddedRoll(rollNo: number) {
  return String(Math.max(0, Math.trunc(rollNo))).padStart(3, "0");
}

/** Rejects roll-only values such as "12" or "012". */
export function isRollOnlyCode(value: string) {
  return /^\d{1,4}$/.test(normalizeVerificationCode(value));
}

/**
 * A printable Code-128 value must include the school prefix and the class/section/roll
 * tail — never digits alone.
 */
export function isSafeVerificationCode(value: string) {
  const code = normalizeVerificationCode(value);
  if (!code || isRollOnlyCode(code)) return false;
  if (code.length < 8) return false;
  if (!/^[A-Z]{2,}/.test(code)) return false;
  if (!/\d/.test(code)) return false;
  return true;
}

export function buildVerificationCode(opts: {
  schoolCode: string;
  yearLabel: string;
  className: string;
  section: string;
  rollNo: number;
  suffix?: string;
}) {
  const school = alnumUpper(opts.schoolCode) || "JPS";
  const year = yearSuffix(opts.yearLabel);
  const klass = alnumUpper(opts.className);
  const section = alnumUpper(opts.section);
  const roll = paddedRoll(opts.rollNo);
  const suffix = opts.suffix ? alnumUpper(opts.suffix) : "";
  const code = `${school}${year}${klass}${section}${roll}${suffix}`;
  if (isRollOnlyCode(code) || !isSafeVerificationCode(code)) {
    throw new Error("Refusing to issue a roll-only verification code");
  }
  return code;
}

export function verifyUrl(origin: string, code: string) {
  const host = origin.replace(/\/$/, "");
  return `${host}/verify?code=${encodeURIComponent(normalizeVerificationCode(code))}`;
}

export function codeFromScanPayload(raw: string) {
  const trimmed = raw.trim();
  try {
    const url = new URL(trimmed);
    const fromQuery = url.searchParams.get("code");
    if (fromQuery) return normalizeVerificationCode(fromQuery);
  } catch {
    /* not a URL — treat as the code itself */
  }
  const q = trimmed.match(/[?&]code=([^&]+)/i);
  if (q) return normalizeVerificationCode(decodeURIComponent(q[1]));
  return normalizeVerificationCode(trimmed);
}

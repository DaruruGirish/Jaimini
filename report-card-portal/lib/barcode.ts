import { prisma } from "./prisma";
import { buildVerificationCode, isSafeVerificationCode } from "./verification-code";

export {
  alnumUpper,
  buildVerificationCode,
  codeFromScanPayload,
  isRollOnlyCode,
  isSafeVerificationCode,
  normalizeVerificationCode,
  paddedRoll,
  verifyUrl,
  yearSuffix,
} from "./verification-code";

async function codeTaken(code: string) {
  const [sheet, exam] = await Promise.all([
    prisma.markSheet.findUnique({ where: { verificationCode: code } }),
    prisma.examCard.findUnique({ where: { verificationCode: code } }),
  ]);
  return Boolean(sheet || exam);
}

export async function uniqueVerificationCode(opts: {
  schoolCode: string;
  yearLabel: string;
  className: string;
  section: string;
  rollNo: number;
  suffix?: string;
}) {
  let code = buildVerificationCode(opts);
  for (let i = 0; i < 12; i++) {
    if (!isSafeVerificationCode(code)) {
      throw new Error("Refusing to barcode a roll number alone");
    }
    if (!(await codeTaken(code))) return code;
    const extra = Math.random().toString(36).slice(2, 4).toUpperCase();
    code = buildVerificationCode({ ...opts, suffix: `${opts.suffix ?? ""}${extra}` });
  }
  const fallback = buildVerificationCode({
    ...opts,
    suffix: `${opts.suffix ?? ""}${Date.now().toString(36).slice(-4).toUpperCase()}`,
  });
  if (!isSafeVerificationCode(fallback)) {
    throw new Error("Refusing to barcode a roll number alone");
  }
  return fallback;
}

export function numberInRange(value: FormDataEntryValue | null, name: string, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new Error(`${name} must be between ${min} and ${max}.`);
  }
  return parsed;
}

export function requiredText(value: FormDataEntryValue | null, name: string, maxLength: number) {
  const parsed = String(value ?? "").trim();
  if (!parsed || parsed.length > maxLength) {
    throw new Error(`${name} is required and must be at most ${maxLength} characters.`);
  }
  return parsed;
}

export function oneOf<T extends string>(value: FormDataEntryValue | null, allowed: readonly T[], fallback: T) {
  const parsed = String(value ?? "");
  return allowed.includes(parsed as T) ? parsed as T : fallback;
}

export function dateOnly(value: FormDataEntryValue | null) {
  const parsed = String(value ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(parsed) || Number.isNaN(Date.parse(`${parsed}T00:00:00Z`))) {
    throw new Error("Date is invalid.");
  }
  return parsed;
}

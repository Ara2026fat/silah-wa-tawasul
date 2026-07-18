/** Strips everything except digits and a leading +. */
export function normalizePhone(raw: string): string {
  const trimmed = raw.trim();
  const plus = trimmed.startsWith('+') ? '+' : '';
  return plus + trimmed.replace(/\D/g, '');
}

/** wa.me requires digits only, no leading +. */
export function toWhatsAppLink(phone: string, message?: string): string {
  const digits = normalizePhone(phone).replace(/^\+/, '');
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function toTelLink(phone: string): string {
  return `tel:${normalizePhone(phone)}`;
}

export function isValidPhone(phone: string): boolean {
  return normalizePhone(phone).replace(/^\+/, '').length >= 6;
}
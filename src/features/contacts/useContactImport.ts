/**
 * The Contact Picker API is only available on Chrome for Android today.
 * Everywhere else (iOS, desktop) we feature-detect and hide the import
 * button rather than showing a broken affordance.
 */

interface PickedContact {
  name?: string[];
  tel?: string[];
}

interface ContactsManagerNavigator extends Navigator {
  contacts?: {
    select: (
      properties: string[],
      options?: { multiple?: boolean }
    ) => Promise<PickedContact[]>;
  };
}

export function contactImportSupported(): boolean {
  return typeof navigator !== 'undefined' && 'contacts' in navigator;
}

export async function pickDeviceContacts(): Promise<Array<{ name: string; phone: string | null }>> {
  const nav = navigator as ContactsManagerNavigator;
  if (!nav.contacts) return [];

  const picked = await nav.contacts.select(['name', 'tel'], { multiple: true });

  return picked.map((p) => ({
    name: p.name?.[0]?.trim() || 'بدون اسم',
    phone: p.tel?.[0] ?? null,
  }));
}

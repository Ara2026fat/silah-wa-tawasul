import { logInteraction, toggleFavorite } from './contactsRepo';
import { toTelLink, toWhatsAppLink } from '@/utils/phone';
import { toast } from '@/store/toastStore';
import type { Contact } from '@/types';

/**
 * One place for "what happens when you tap WhatsApp / Call / Mark as
 * contacted / Favorite" — every card and detail view calls into this
 * instead of re-implementing the same three branches.
 */
export function useContactActions(contact: Pick<Contact, 'id' | 'phone' | 'favorite'>) {
  const openWhatsApp = () => {
    if (!contact.phone) return;
    window.open(toWhatsAppLink(contact.phone), '_blank', 'noopener');
    logInteraction(contact.id, 'whatsapp').catch(() => toast.error('تعذّر تسجيل التواصل'));
  };

  const callPhone = () => {
    if (!contact.phone) return;
    window.location.href = toTelLink(contact.phone);
    logInteraction(contact.id, 'call').catch(() => toast.error('تعذّر تسجيل التواصل'));
  };

  const markContacted = async () => {
    try {
      await logInteraction(contact.id, 'manual');
      toast.success('تم تسجيل التواصل');
    } catch {
      toast.error('تعذّر تسجيل التواصل');
    }
  };

  const toggleFavoriteStatus = async () => {
    try {
      await toggleFavorite(contact.id, !contact.favorite);
    } catch {
      toast.error('تعذّر تحديث المفضلة');
    }
  };

  return { openWhatsApp, callPhone, markContacted, toggleFavoriteStatus };
}

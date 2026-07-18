import { memo } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Phone, Star } from 'lucide-react';
import { ReminderBadge } from '@/features/reminders/ReminderBadge';
import { useContactActions } from './useContactActions';
import { formatRelativeArabic } from '@/utils/date';
import { getInitial } from '@/utils/text';
import { IconButton } from '@/components/ui/IconButton';
import type { ContactWithStatus } from '@/types';

function ContactCardImpl({ contact }: { contact: ContactWithStatus }) {
  const hasPhone = Boolean(contact.phone);
  const { openWhatsApp, callPhone } = useContactActions(contact);

  return (
    <Link
      to={`/contacts/${contact.id}`}
      className="flex items-center gap-3 rounded-xl2 border border-sand-200 bg-white px-4 py-3.5 shadow-soft transition-colors hover:border-olive-400/50 dark:border-night-line dark:bg-night-surface dark:shadow-soft-dark dark:hover:border-olive-400/40"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-olive-50 text-base font-bold text-olive-600 dark:bg-olive-400/15 dark:text-olive-400">
        {getInitial(contact.name)}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate font-medium text-ink-600 dark:text-mist-100">{contact.name}</span>
          {contact.favorite && (
            <Star size={14} className="shrink-0 fill-clay-400 text-clay-400" aria-label="مفضّل" />
          )}
        </div>
        <div className="mt-1 flex items-center gap-2">
          <ReminderBadge status={contact.status} />
          <span className="truncate text-xs text-ink-400 dark:text-mist-500">
            {formatRelativeArabic(contact.lastContactedAt)}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 gap-1">
        <IconButton
          label="واتساب"
          onClick={(e) => {
            e.preventDefault();
            openWhatsApp();
          }}
          disabled={!hasPhone}
        >
          <MessageCircle size={18} />
        </IconButton>
        <IconButton
          label="اتصال"
          onClick={(e) => {
            e.preventDefault();
            callPhone();
          }}
          disabled={!hasPhone}
        >
          <Phone size={18} />
        </IconButton>
      </div>
    </Link>
  );
}

export const ContactCard = memo(ContactCardImpl);

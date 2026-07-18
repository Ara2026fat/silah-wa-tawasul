import { memo } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Phone, CheckCircle2 } from 'lucide-react';
import { useContactActions } from '@/features/contacts/useContactActions';
import { daysLabel } from './dashboardMetrics';
import { IconButton } from '@/components/ui/IconButton';
import type { ContactWithStatus } from '@/types';

function QuickActionRowImpl({ contact }: { contact: ContactWithStatus }) {
  const { openWhatsApp, callPhone, markContacted } = useContactActions(contact);

  return (
    <div className="flex items-center gap-3 rounded-xl2 border border-sand-200 bg-white px-3.5 py-3 shadow-soft dark:border-night-line dark:bg-night-surface dark:shadow-soft-dark">
      <Link to={`/contacts/${contact.id}`} className="min-w-0 flex-1">
        <p className="truncate font-medium text-ink-600 dark:text-mist-100">{contact.name}</p>
        <p className="text-xs text-clay-600 dark:text-clay-400">{daysLabel(contact.daysUntilDue)}</p>
      </Link>

      <div className="flex shrink-0 gap-1">
        <IconButton label="واتساب" disabled={!contact.phone} onClick={openWhatsApp}>
          <MessageCircle size={18} />
        </IconButton>
        <IconButton label="اتصال" disabled={!contact.phone} onClick={callPhone}>
          <Phone size={18} />
        </IconButton>
        <IconButton label="تمّ التواصل" onClick={markContacted}>
          <CheckCircle2 size={18} />
        </IconButton>
      </div>
    </div>
  );
}

export const QuickActionRow = memo(QuickActionRowImpl);

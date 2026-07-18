import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowRight, MessageCircle, Phone, Star, Pencil, Trash2, CheckCircle2, Clock3 } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { PageContainer } from '@/components/layout/PageContainer';
import { IconButton } from '@/components/ui/IconButton';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { ReminderBadge } from '@/features/reminders/ReminderBadge';
import { GroupBadge } from '@/features/groups/GroupBadge';
import { contactInteractions, deleteContact } from '@/features/contacts/contactsRepo';
import { useContactActions } from '@/features/contacts/useContactActions';
import { useContact } from '@/hooks/useContacts';
import { useGroups } from '@/hooks/useGroups';
import { formatDateArabic, formatRelativeArabic, reminderStatus } from '@/utils/date';
import { getInitial } from '@/utils/text';
import { toast } from '@/store/toastStore';
import type { Interaction } from '@/types';

const CHANNEL_LABEL: Record<Interaction['channel'], string> = {
  whatsapp: 'واتساب',
  call: 'اتصال',
  manual: 'تواصل يدوي',
};

const CHANNEL_ICON: Record<Interaction['channel'], typeof MessageCircle> = {
  whatsapp: MessageCircle,
  call: Phone,
  manual: CheckCircle2,
};

export function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const contact = useContact(id);
  const groups = useGroups();
  const navigate = useNavigate();
  const [history, setHistory] = useState<Interaction[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (id) contactInteractions(id).then(setHistory);
  }, [id, contact?.updatedAt]);

  // useLiveQuery returns `undefined` both while the query is still loading
  // and when the id genuinely doesn't exist. IndexedDB reads resolve near
  // instantly, so a short timeout is enough to tell "still loading" apart
  // from "this link is stale/broken" without adding a second data source.
  useEffect(() => {
    setTimedOut(false);
    const timer = setTimeout(() => setTimedOut(true), 1200);
    return () => clearTimeout(timer);
  }, [id]);

  const actions = useContactActions(contact ?? { id: id ?? '', phone: null, favorite: false });

  if (contact === undefined && !timedOut) {
    return (
      <>
        <TopBar title="جهة اتصال" />
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      </>
    );
  }

  if (!contact || !id) {
    return (
      <>
        <TopBar title="غير موجود" />
        <PageContainer>
          <p className="text-sm text-ink-400 dark:text-mist-500">
            تعذّر العثور على جهة الاتصال. قد تكون حُذفت.
          </p>
        </PageContainer>
      </>
    );
  }

  const contactGroups = groups?.filter((g) => contact.groupIds.includes(g.id)) ?? [];
  const { status } = reminderStatus(contact);

  const handleDelete = async () => {
    if (!confirm(`هل تريد حذف ${contact.name}؟ لا يمكن التراجع عن هذا الإجراء.`)) return;
    setDeleting(true);
    try {
      await deleteContact(id);
      toast.success('تم حذف جهة الاتصال');
      navigate('/contacts', { replace: true });
    } catch {
      toast.error('تعذّر حذف جهة الاتصال');
      setDeleting(false);
    }
  };

  return (
    <>
      <TopBar
        title={contact.name}
        action={
          <IconButton label="رجوع" onClick={() => navigate(-1)}>
            <ArrowRight size={19} />
          </IconButton>
        }
      />

      <PageContainer className="mx-auto flex w-full max-w-lg flex-col gap-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-olive-50 text-2xl font-bold text-olive-600 dark:bg-olive-400/15 dark:text-olive-400">
            {getInitial(contact.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              {contactGroups.map((g) => (
                <GroupBadge key={g.id} group={g} />
              ))}
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <ReminderBadge status={status} />
              <span className="text-xs text-ink-400 dark:text-mist-500">
                {formatRelativeArabic(contact.lastContactedAt)}
              </span>
            </div>
          </div>
          <IconButton
            label={contact.favorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
            onClick={actions.toggleFavoriteStatus}
          >
            <Star
              size={19}
              className={contact.favorite ? 'fill-clay-400 text-clay-400' : 'text-ink-400 dark:text-mist-500'}
            />
          </IconButton>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" disabled={!contact.phone} onClick={actions.openWhatsApp}>
            <MessageCircle size={17} /> واتساب
          </Button>
          <Button variant="secondary" disabled={!contact.phone} onClick={actions.callPhone}>
            <Phone size={17} /> اتصال
          </Button>
        </div>

        <Button variant="ghost" onClick={actions.markContacted}>
          <CheckCircle2 size={17} /> تسجيل تواصل يدوي الآن
        </Button>

        {contact.notes && (
          <div className="rounded-xl2 bg-sand-200/60 p-3.5 text-sm text-ink-600 dark:bg-night-raised dark:text-mist-100">
            {contact.notes}
          </div>
        )}

        <div>
          <h3 className="mb-2 text-sm font-bold text-ink-500 dark:text-mist-300">سجل التواصل</h3>
          {history.length === 0 ? (
            <p className="text-sm text-ink-400 dark:text-mist-500">لا يوجد سجل تواصل بعد.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {history.map((h) => {
                const Icon = CHANNEL_ICON[h.channel];
                return (
                  <li
                    key={h.id}
                    className="flex items-center justify-between rounded-xl2 border border-sand-200 px-3.5 py-2.5 text-sm dark:border-night-line"
                  >
                    <span className="flex items-center gap-2 text-ink-600 dark:text-mist-100">
                      <Icon size={15} className="text-ink-400 dark:text-mist-500" aria-hidden="true" />
                      {CHANNEL_LABEL[h.channel]}
                    </span>
                    <span className="flex items-center gap-1 text-ink-400 dark:text-mist-500">
                      <Clock3 size={13} aria-hidden="true" />
                      {formatDateArabic(h.occurredAt)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="mt-2 flex gap-2">
          <Link to={`/contacts/${id}/edit`} className="flex-1">
            <Button variant="secondary" fullWidth>
              <Pencil size={16} /> تعديل
            </Button>
          </Link>
          <Button variant="danger" onClick={handleDelete} disabled={deleting}>
            <Trash2 size={16} /> حذف
          </Button>
        </div>
      </PageContainer>
    </>
  );
}

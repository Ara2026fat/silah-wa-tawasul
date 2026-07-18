import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { GroupBadge } from '@/features/groups/GroupBadge';
import { INTERVAL_OPTIONS } from '@/features/reminders/reminderPresentation';
import { useGroups } from '@/hooks/useGroups';
import { usePreferencesStore } from '@/store/preferencesStore';
import { toast } from '@/store/toastStore';
import { isValidPhone } from '@/utils/phone';
import type { ContactInput } from './contactsRepo';
import type { Contact } from '@/types';

interface ContactFormProps {
  initial?: Contact;
  submitLabel: string;
  onSubmit: (input: ContactInput) => Promise<void>;
}

export function ContactForm({ initial, submitLabel, onSubmit }: ContactFormProps) {
  const groups = useGroups();
  const defaultIntervalDays = usePreferencesStore((s) => s.defaultIntervalDays);
  const [name, setName] = useState(initial?.name ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [groupIds, setGroupIds] = useState<string[]>(initial?.groupIds ?? []);
  const [intervalDays, setIntervalDays] = useState<string>(() => {
    if (initial) return initial.intervalDays ? String(initial.intervalDays) : '';
    return defaultIntervalDays ? String(defaultIntervalDays) : '';
  });
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [favorite, setFavorite] = useState(initial?.favorite ?? false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const toggleGroup = (id: string) => {
    setGroupIds((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const nextErrors: typeof errors = {};
    if (!name.trim()) nextErrors.name = 'الاسم مطلوب';
    if (phone.trim() && !isValidPhone(phone)) nextErrors.phone = 'رقم الهاتف غير صحيح';
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        name,
        phone: phone.trim() || null,
        groupIds,
        intervalDays: intervalDays ? (Number(intervalDays) as ContactInput['intervalDays']) : null,
        notes,
        favorite,
      });
    } catch {
      toast.error('تعذّر حفظ جهة الاتصال، حاول مرة أخرى');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="الاسم"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        autoFocus
        required
      />
      <Input
        label="رقم الهاتف (اختياري)"
        type="tel"
        dir="ltr"
        placeholder="+9665xxxxxxxx"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        error={errors.phone}
      />

      <div>
        <span className="mb-1.5 block text-sm font-medium text-ink-500 dark:text-mist-300">المجموعات</span>
        <div className="flex flex-wrap gap-2">
          {groups?.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => toggleGroup(g.id)}
              className={
                groupIds.includes(g.id)
                  ? 'rounded-full ring-2 ring-olive-500 dark:ring-olive-400'
                  : 'rounded-full opacity-60'
              }
            >
              <GroupBadge group={g} />
            </button>
          ))}
        </div>
      </div>

      <Select
        label="تذكير التواصل"
        value={intervalDays}
        onChange={(e) => setIntervalDays(e.target.value)}
      >
        <option value="">بلا تذكير</option>
        {INTERVAL_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="notes" className="text-sm font-medium text-ink-500 dark:text-mist-300">
          ملاحظات (اختياري)
        </label>
        <textarea
          id="notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="rounded-xl2 border border-sand-300 bg-white px-3.5 py-2.5 text-ink-600 focus:border-olive-500 focus:outline-none dark:border-night-line dark:bg-night-surface dark:text-mist-100 dark:focus:border-olive-400"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-ink-500 dark:text-mist-300">
        <input
          type="checkbox"
          checked={favorite}
          onChange={(e) => setFavorite(e.target.checked)}
          className="h-4 w-4 accent-olive-500 dark:accent-olive-400"
        />
        إضافة إلى المفضلة
      </label>

      <Button type="submit" disabled={submitting}>
        {submitLabel}
      </Button>
    </form>
  );
}

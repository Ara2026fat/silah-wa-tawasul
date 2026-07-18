import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

const COLOR_CHOICES = [
  { value: 'olive', label: 'أخضر زيتوني' },
  { value: 'clay', label: 'ذهبي' },
  { value: 'ink', label: 'رمادي' },
  { value: 'bloom', label: 'وردي دافئ' },
  { value: 'steel', label: 'أزرق رمادي' },
];

interface GroupFormProps {
  initialName?: string;
  initialColor?: string;
  submitLabel: string;
  onSubmit: (name: string, color: string) => Promise<void>;
}

export function GroupForm({ initialName = '', initialColor = 'olive', submitLabel, onSubmit }: GroupFormProps) {
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(initialColor);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('اسم المجموعة مطلوب');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(name, color);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="اسم المجموعة"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setError('');
        }}
        error={error}
        autoFocus
      />
      <Select label="اللون" value={color} onChange={(e) => setColor(e.target.value)}>
        {COLOR_CHOICES.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </Select>
      <Button type="submit" disabled={submitting}>
        {submitLabel}
      </Button>
    </form>
  );
}

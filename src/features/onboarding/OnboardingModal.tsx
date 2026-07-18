import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeartHandshake } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

const STORAGE_KEY = 'sila-onboarded';

export function OnboardingModal() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const seen = window.localStorage.getItem(STORAGE_KEY);
    if (!seen) setOpen(true);
  }, []);

  const dismiss = () => {
    window.localStorage.setItem(STORAGE_KEY, '1');
    setOpen(false);
  };

  return (
    <Modal title="أهلًا بك" open={open} onClose={dismiss}>
      <div className="flex flex-col gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-olive-50 text-olive-600 dark:bg-olive-400/15 dark:text-olive-400">
          <HeartHandshake size={24} aria-hidden="true" />
        </div>
        <p className="text-sm leading-relaxed text-ink-600 dark:text-mist-100">
          صلة وتواصل يذكّرك بمن يهمّونك، ويساعدك على التواصل معهم بانتظام — ليس تطبيق مراسلة، فقط تذكير بسيط
          ثم تواصل بضغطة واحدة عبر واتساب أو الاتصال.
        </p>
        <p className="text-sm leading-relaxed text-ink-500 dark:text-mist-300">
          أضف أول جهة اتصال، وحدّد كل كم مدة تريد تذكّرك بالتواصل معها — والباقي على التطبيق.
        </p>
        <div className="flex gap-2">
          <Button
            fullWidth
            onClick={() => {
              dismiss();
              navigate('/contacts/new');
            }}
          >
            إضافة أول جهة اتصال
          </Button>
          <Button variant="secondary" onClick={dismiss}>
            لاحقًا
          </Button>
        </div>
      </div>
    </Modal>
  );
}

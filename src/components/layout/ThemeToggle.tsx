import { Moon, Sun } from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';
import { useThemeStore } from '@/store/themeStore';

export function ThemeToggle() {
  const { resolved, toggle } = useThemeStore();

  return (
    <IconButton label={resolved === 'dark' ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن'} onClick={toggle}>
      {resolved === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
    </IconButton>
  );
}

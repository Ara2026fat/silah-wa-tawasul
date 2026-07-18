import type { GroupKey } from '@/types';

export type DashboardMode = 'overview' | 'family' | 'relatives' | 'friends' | 'work';

interface ModeMeta {
  label: string;
  /** Group keys included in this mode's filter. Empty = no filter (overview = everyone). */
  groupKeys: GroupKey[];
  /** Static, fully-written Tailwind classes — must stay literal strings for the JIT scanner. */
  accent: {
    text: string;
    bg: string;
    ring: string;
    gaugeFrom: string;
    gaugeTo: string;
  };
}

export const DASHBOARD_MODES: Record<DashboardMode, ModeMeta> = {
  overview: {
    label: 'نظرة عامة',
    groupKeys: [],
    accent: {
      text: 'text-olive-600',
      bg: 'bg-olive-500',
      ring: 'ring-olive-500',
      gaugeFrom: '#4A5D3A',
      gaugeTo: '#96691E',
    },
  },
  family: {
    label: 'العائلة',
    groupKeys: ['parents', 'siblings'],
    accent: {
      text: 'text-olive-600',
      bg: 'bg-olive-600',
      ring: 'ring-olive-600',
      gaugeFrom: '#324027',
      gaugeTo: '#6B8058',
    },
  },
  relatives: {
    label: 'الأقارب',
    groupKeys: ['relatives'],
    accent: {
      text: 'text-clay-600',
      bg: 'bg-clay-500',
      ring: 'ring-clay-500',
      gaugeFrom: '#96691E',
      gaugeTo: '#C99A3B',
    },
  },
  friends: {
    label: 'الأصدقاء',
    groupKeys: ['friends'],
    accent: {
      text: 'text-bloom-600',
      bg: 'bg-bloom-500',
      ring: 'ring-bloom-500',
      gaugeFrom: '#8A4744',
      gaugeTo: '#B37671',
    },
  },
  work: {
    label: 'العمل',
    groupKeys: ['work'],
    accent: {
      text: 'text-steel-600',
      bg: 'bg-steel-500',
      ring: 'ring-steel-500',
      gaugeFrom: '#3D4E5B',
      gaugeTo: '#6C8494',
    },
  },
};

export const MODE_ORDER: DashboardMode[] = ['overview', 'family', 'relatives', 'friends', 'work'];

import type { Icon } from '@/shared/ui';

export type CommandCategory =
  'Lối tắt tác vụ' | 'Khu vực mua sắm' | 'Kênh người bán & Quản trị' | 'Chính sách & Hướng dẫn';

export interface CommandItem {
  id: string;
  title: string;
  description?: string;
  category: CommandCategory;
  icon: Parameters<typeof Icon>[0]['name'];
  shortcut?: string;
  action: () => void;
}

import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { PageContainer } from '@/components/layout/PageContainer';
import { IconButton } from '@/components/ui/IconButton';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { GroupForm } from '@/features/groups/GroupForm';
import { GroupBadge } from '@/features/groups/GroupBadge';
import { createGroup, deleteGroup, renameGroup } from '@/features/groups/groupsRepo';
import { useGroupCounts, useGroups } from '@/hooks/useGroups';
import { toast } from '@/store/toastStore';
import type { Group } from '@/types';

export function GroupsPage() {
  const groups = useGroups();
  const counts = useGroupCounts();
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Group | null>(null);

  const handleDelete = async (group: Group) => {
    if (!confirm(`حذف مجموعة "${group.name}"؟ ستُزال من جميع جهات الاتصال المرتبطة بها.`)) return;
    try {
      await deleteGroup(group.id);
      toast.success('تم حذف المجموعة');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'تعذّر حذف المجموعة');
    }
  };

  return (
    <>
      <TopBar
        title="المجموعات"
        action={
          <IconButton label="إضافة مجموعة" onClick={() => setAddOpen(true)}>
            <Plus size={19} />
          </IconButton>
        }
      />

      <PageContainer className="mx-auto w-full max-w-2xl">
        {groups?.length === 0 && (
          <EmptyState title="لا توجد مجموعات" description="أضف مجموعة لتنظيم جهات اتصالك." />
        )}
        <ul className="flex flex-col gap-2">
          {groups?.map((g) => (
            <li
              key={g.id}
              className="flex items-center justify-between rounded-xl2 border border-sand-200 bg-white px-4 py-3 shadow-soft dark:border-night-line dark:bg-night-surface dark:shadow-soft-dark"
            >
              <div className="flex items-center gap-2.5">
                <GroupBadge group={g} />
                <span className="text-xs text-ink-400 dark:text-mist-500">{counts?.[g.id] ?? 0} جهة اتصال</span>
              </div>
              <div className="flex gap-1">
                <IconButton label="تعديل" onClick={() => setEditing(g)}>
                  <Pencil size={16} />
                </IconButton>
                {!g.isDefault && (
                  <IconButton label="حذف" onClick={() => handleDelete(g)}>
                    <Trash2 size={16} />
                  </IconButton>
                )}
              </div>
            </li>
          ))}
        </ul>
      </PageContainer>

      <Modal title="مجموعة جديدة" open={addOpen} onClose={() => setAddOpen(false)}>
        <GroupForm
          submitLabel="إضافة"
          onSubmit={async (name, color) => {
            try {
              await createGroup(name, color);
              toast.success('تمت إضافة المجموعة');
              setAddOpen(false);
            } catch {
              toast.error('تعذّر إضافة المجموعة');
            }
          }}
        />
      </Modal>

      <Modal title="تعديل المجموعة" open={editing !== null} onClose={() => setEditing(null)}>
        {editing && (
          <GroupForm
            initialName={editing.name}
            initialColor={editing.color}
            submitLabel="حفظ"
            onSubmit={async (name) => {
              try {
                await renameGroup(editing.id, name);
                toast.success('تم حفظ التغييرات');
                setEditing(null);
              } catch {
                toast.error('تعذّر حفظ التغييرات');
              }
            }}
          />
        )}
      </Modal>
    </>
  );
}

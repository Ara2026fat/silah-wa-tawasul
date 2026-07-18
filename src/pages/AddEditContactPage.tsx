import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { PageContainer } from '@/components/layout/PageContainer';
import { IconButton } from '@/components/ui/IconButton';
import { ContactForm } from '@/features/contacts/ContactForm';
import { createContact, updateContact } from '@/features/contacts/contactsRepo';
import { useContact } from '@/hooks/useContacts';
import { toast } from '@/store/toastStore';

export function AddEditContactPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'new';
  const existing = useContact(isNew ? undefined : id);
  const navigate = useNavigate();

  if (!isNew && existing === undefined) {
    return null; // loading
  }

  return (
    <>
      <TopBar
        title={isNew ? 'إضافة جهة اتصال' : 'تعديل جهة الاتصال'}
        action={
          <IconButton label="رجوع" onClick={() => navigate(-1)}>
            <ArrowRight size={19} />
          </IconButton>
        }
      />
      <PageContainer className="mx-auto w-full max-w-lg">
        <ContactForm
          initial={existing ?? undefined}
          submitLabel={isNew ? 'إضافة' : 'حفظ التغييرات'}
          onSubmit={async (input) => {
            if (isNew) {
              const newContactId = await createContact(input);
              toast.success('تمت إضافة جهة الاتصال');
              navigate(`/contacts/${newContactId}`, { replace: true });
            } else if (id) {
              await updateContact(id, input);
              toast.success('تم حفظ التغييرات');
              navigate(`/contacts/${id}`, { replace: true });
            }
          }}
        />
      </PageContainer>
    </>
  );
}

import Form from 'next/form';

import { safeSignOut } from '@/app/(auth)/utils/safe-logout';
import { useTranslation } from 'react-i18next';
import { useSession } from 'next-auth/react';
import '@/i18n/index';

export const SignOutForm = () => {
  const { t } = useTranslation();
  const { data: session } = useSession();
  return (
    <Form
      className="w-full"
      action={() => {
        safeSignOut({ redirectTo: '/', jti: session?.user.jti });
      }}
    >
      <button
        type="submit"
        className="w-full text-left px-1 py-0.5 text-red-500"
      >
        {t('button.logout')}
      </button>
    </Form>
  );
};

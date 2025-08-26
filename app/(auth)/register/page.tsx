'use client';
import '@/i18n/index';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import { register, type RegisterActionState } from '../actions';
import { toast } from '@/components/toast';
import { useSession } from 'next-auth/react';

import { useTranslation } from 'react-i18next';

export default function Page() {
  const { t } = useTranslation();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [state, formAction] = useActionState<RegisterActionState, FormData>(
    register,
    {
      status: 'idle',
    },
  );

  const { update: updateSession } = useSession();

  useEffect(() => {
    if (state.status === 'user_exists') {
      toast({ type: 'error', description: t('register.already_exists') });
    } else if (state.status === 'failed') {
      toast({ type: 'error', description: t('register.create.failed') });
    } else if (state.status === 'invalid_data') {
      toast({
        type: 'error',
        description: t('auth.unable_to_verify_submission'),
      });
    } else if (state.status === 'success') {
      toast({ type: 'success', description: t('register.create.success') });

      setIsSuccessful(true);
      updateSession();
      router.refresh();
    }
  }, [state, router, t, updateSession]);

  const passwordPattern =
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,32}$/;
  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get('email') as string);
    const pwd = formData.get('password') as string;
    const confirmPwd = formData.get('confirmPassword') as string;
    if (pwd !== confirmPwd) {
      toast({
        type: 'error',
        description: t('register.password_inconsistent'),
      });
      return;
    }
    if (!passwordPattern.test(pwd)) {
      toast({
        type: 'error',
        description: t('password.not_compliant'),
      });
      return;
    }
    formAction(formData);
  };

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl gap-12 flex flex-col">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">
            {t('register.title')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            {t('register.subtitle')}
          </p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(new FormData(e.currentTarget));
          }}
          className="flex flex-col gap-4 px-4 sm:px-16"
        >
          <div className="flex flex-col gap-2">
            <label
              htmlFor="email"
              className="text-zinc-600 font-normal dark:text-zinc-400"
            >
              {t('auth.email_address')}
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="user@example.com"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label
              htmlFor="password"
              className="text-zinc-600 font-normal dark:text-zinc-400"
            >
              {t('auth.password')}
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              maxLength={32}
              pattern={
                '^(?=.*[A-Za-z])(?=.*\\d)(?=.*[!@#$%^&*()_+-=[]{};\':"\\|,.<>/?]).{8,32}$'
              }
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPassword(e.target.value)
              }
              placeholder={t('password.not_compliant')}
              autoComplete="new-password"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label
              htmlFor="confirmPassword"
              className="text-zinc-600 font-normal dark:text-zinc-400"
            >
              {t('register.confirm_password')}
            </label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={8}
              maxLength={32}
              value={confirmPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setConfirmPassword(e.target.value)
              }
              placeholder={t('register.enter_again')}
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" disabled={isSuccessful}>
            {t('register.title')}
          </Button>
          <p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
            {`${t('register.have_account')} `}
            <Link
              href="/login"
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
            >
              {t('login.title')}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

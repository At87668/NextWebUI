import '@/i18n/index';
import React, { useState } from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { EyeIcon, EyeOffIcon } from './ui/eye-icon';
import { useTranslation } from 'react-i18next';

interface AuthFormProps {
  action: NonNullable<
    string | ((formData: FormData) => void | Promise<void>) | undefined
  >;
  children: React.ReactNode;
  defaultEmail?: string;
}

export function AuthForm({
  action,
  children,
  defaultEmail = '',
}: AuthFormProps) {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  return (
    <form action={action} className="flex flex-col gap-4 px-4 sm:px-16">
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="email"
          className="text-zinc-600 font-normal dark:text-zinc-400"
        >
          {t('auth.email_address')}
        </Label>
        <Input
          id="email"
          name="email"
          className="bg-muted text-md md:text-sm"
          type="email"
          placeholder="user@example.com"
          autoComplete="email"
          required
          autoFocus
          defaultValue={defaultEmail}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="password"
          className="text-zinc-600 font-normal dark:text-zinc-400"
        >
          {t('auth.password')}
        </Label>
        <Input
          id="password"
          name="password"
          className="bg-muted text-md md:text-sm"
          type={showPassword ? 'text' : 'password'}
          required
        />
      </div>
      {children}
    </form>
  );
}

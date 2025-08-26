'use client';

import '@/i18n/index';

import Image from 'next/image';
import type { User } from 'next-auth';
import { useSession } from 'next-auth/react';
import { safeSignOut } from '@/app/(auth)/utils/safe-logout';
import { useTheme } from 'next-themes';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  MonitorIcon,
  MessageSquare,
  User as UserIcon,
  Info,
  Settings,
  LogIn,
  LogOut,
  ChevronUp,
} from 'lucide-react';

import md5 from 'md5';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useRouter } from 'next/navigation';
import { toast } from './toast';
import { LoaderIcon } from './icons';
import { guestRegex } from '@/lib/constants';
import { NicknameEditor } from './nickname-editor';
import { useTranslation } from 'react-i18next';
import { useOnClickOutside } from 'usehooks-ts';

export function SidebarUserNav({ user }: { user: User }) {
  const { i18n, t } = useTranslation();
  const router = useRouter();

  const { setTheme, theme, resolvedTheme } = useTheme();
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [originalPrompt, setOriginalPrompt] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<
    'interface' | 'chat' | 'user' | 'about'
  >('interface');

  const [systemPrompt, setSystemPrompt] = useState('');
  useEffect(() => {
    async function fetchSystemPrompt() {
      try {
        const res = await fetch('/api/user/system-prompt');
        if (res.ok) {
          const session = await res.json();
          if (session?.systemPrompt) setSystemPrompt(session.systemPrompt);
        }
      } catch {}
    }
    if (session?.user?.id) fetchSystemPrompt();
  }, [session?.user?.id]);

  useOnClickOutside(dropdownRef, () => {
    setIsLanguageOpen(false);
  });

  async function saveSystemPromptToDB(prompt: string) {
    try {
      await fetch('/api/user/system-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemPrompt: prompt }),
      });
    } catch {}
  }
  const isGuest = guestRegex.test(session?.user?.email ?? '');

  const renderWithLineBreaks = (text: string) => {
  return text.split('\n').map((line, index) => (
    // biome-ignore lint/suspicious/noArrayIndexKey: Static content, index is safe here
    <span key={index}>
      {line}
      {index < text.split('\n').length - 1 && <br />}
    </span>
  ));
};

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && settingsOpen) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [settingsOpen]);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {status === 'loading' ? (
              <SidebarMenuButton className="session-[state=open]:bg-sidebar-accent bg-background session-[state=open]:text-sidebar-accent-foreground h-10 justify-between">
                <div className="flex flex-row gap-2">
                  <div className="size-6 bg-zinc-500/30 rounded-full animate-pulse" />
                  <span className="bg-zinc-500/30 text-transparent rounded-md animate-pulse">
                    {t('components.sidebar_user_nav.auth_state.loading')}
                  </span>
                </div>
                <div className="animate-spin text-zinc-500">
                  <LoaderIcon />
                </div>
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton
                session-testid="user-nav-button"
                className="session-[state=open]:bg-sidebar-accent bg-background session-[state=open]:text-sidebar-accent-foreground h-10"
              >
                <Image
                  src={`https://www.gravatar.com/avatar/${md5((user.email ?? '').toLowerCase())}?d=identicon&s=24`}
                  alt={
                    user.email ?? t('components.sidebar_user_nav.user.avatar')
                  }
                  width={24}
                  height={24}
                  className="rounded-full"
                />
                <span session-testid="user-email" className="truncate">
                  {isGuest
                    ? t('auth.user.type.guest')
                    : session?.user?.nick
                      ? session.user.nick
                      : user.email}
                </span>
                <ChevronUp className="ml-auto" />
              </SidebarMenuButton>
            )}
          </DropdownMenuTrigger>

          <DropdownMenuContent
            session-testid="user-nav-menu"
            side="top"
            className="w-[--radix-popper-anchor-width]"
          >
            <>
              <DropdownMenuItem
                session-testid="user-nav-item-settings"
                className="flex cursor-pointer gap-2"
                onSelect={() => setSettingsOpen(true)}
              >
                <Settings className="h-4 w-4" />
                <span>{t('settings.title')}</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />
            </>

            <DropdownMenuItem asChild session-testid="user-nav-item-auth">
              <button
                type="button"
                className="flex w-full cursor-pointer items-center gap-2"
                onClick={() => {
                  if (status === 'loading') {
                    toast({
                      type: 'error',
                      description: t('auth.state.loading'),
                    });
                    return;
                  }

                  if (isGuest) {
                    router.push('/login');
                  } else {
                    safeSignOut({
                      redirectTo: '/',
                      jti: session?.user.jti,
                    });
                  }
                }}
              >
                {isGuest ? (
                  <>
                    <LogIn className="h-4 w-4" />
                    <span>{t('button.login')}</span>
                  </>
                ) : (
                  <>
                    <LogOut className="h-4 w-4" />
                    <span>{t('button.logout')}</span>
                  </>
                )}
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {typeof window !== 'undefined' &&
          settingsOpen &&
          createPortal(
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              style={{ pointerEvents: settingsOpen ? 'auto' : 'none' }}
              role="dialog"
              aria-modal="true"
            >
              <div className="relative w-full max-w-4xl mx-auto max-h-[90vh] flex flex-col md:flex-row shadow-2xl rounded-2xl overflow-hidden border border-zinc-200/20 dark:border-zinc-700/40 bg-white/90 dark:bg-zinc-900/95 backdrop-blur-md">
                <div className="hidden md:flex md:flex-col h-[600px] w-48 bg-zinc-50 dark:bg-zinc-800 border-r border-zinc-200 dark:border-zinc-700">
                  <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                      {t('settings.title')}
                    </h2>
                    <button
                      type="button"
                      className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-lg text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-100 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSettingsOpen(false);
                      }}
                      aria-label={t('settings.close_settings')}
                    >
                      ×
                    </button>
                  </div>

                  {[
                    {
                      id: 'interface',
                      label: t('settings.tabs.interface'),
                      icon: MonitorIcon,
                    },
                    {
                      id: 'chat',
                      label: t('settings.tabs.chat'),
                      icon: MessageSquare,
                    },
                    {
                      id: 'user',
                      label: t('settings.tabs.user'),
                      icon: UserIcon,
                    },
                    {
                      id: 'about',
                      label: t('settings.tabs.about'),
                      icon: Info,
                    },
                  ]
                    .filter((tab) => {
                      if (isGuest) {
                        return tab.id === 'interface' || tab.id === 'about';
                      }
                      return true;
                    })
                    .map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          className={`flex items-center gap-3 px-4 py-3 text-sm font-medium text-left hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors border-r-2 ${
                            activeTab === tab.id
                              ? 'bg-zinc-200 dark:bg-zinc-700 border-blue-500 text-blue-600 dark:text-blue-400'
                              : 'border-transparent text-zinc-700 dark:text-zinc-300'
                          }`}
                          onClick={() =>
                            setActiveTab(
                              tab.id as 'interface' | 'chat' | 'user' | 'about',
                            )
                          }
                        >
                          <Icon size={16} />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                </div>

                <div className="md:hidden flex flex-col">
                  <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                      {t('settings.title')}
                    </h2>
                    <button
                      type="button"
                      className="w-8 h-8 flex items-center justify-center text-lg text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-100 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSettingsOpen(false);
                      }}
                      aria-label={t('settings.close_settings')}
                    >
                      ×
                    </button>
                  </div>

                  <div className="flex border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
                    {[
                      {
                        id: 'interface',
                        label: t('settings.tabs.interface'),
                        icon: MonitorIcon,
                      },
                      {
                        id: 'chat',
                        label: t('settings.tabs.chat'),
                        icon: MessageSquare,
                      },
                      {
                        id: 'user',
                        label: t('settings.tabs.user'),
                        icon: UserIcon,
                      },
                      {
                        id: 'about',
                        label: t('settings.tabs.about'),
                        icon: Info,
                      },
                    ]
                      .filter((tab) => {
                        if (isGuest) {
                          return tab.id === 'interface' || tab.id === 'about';
                        }
                        return true;
                      })
                      .map((tab) => {
                        const Icon = tab.icon;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
                              activeTab === tab.id
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                            }`}
                            onClick={() =>
                              setActiveTab(
                                tab.id as
                                  | 'interface'
                                  | 'chat'
                                  | 'user'
                                  | 'about',
                              )
                            }
                          >
                            <Icon size={16} />
                            <span>{tab.label}</span>
                          </button>
                        );
                      })}
                  </div>
                </div>

                <div className="flex-1 min-h-0 flex flex-col">
                  <div className="flex-1 overflow-y-auto p-6 touch-auto">
                    <h3 className="text-xl font-semibold mb-6 text-zinc-900 dark:text-zinc-100">
                      {activeTab === 'interface' &&
                        t('settings.tabs.interface')}
                      {activeTab === 'chat' && t('settings.tabs.chat')}
                      {activeTab === 'user' && t('settings.tabs.user')}
                      {activeTab === 'about' && t('settings.tabs.about')}
                    </h3>

                    {activeTab === 'interface' && (
                      <div className="space-y-6">
                        <div>
                          <h6 className="font-bold text-zinc-800 dark:text-zinc-200">
                            {t('settings.tabs.language')}
                          </h6>
                          <label
                            htmlFor="language-select"
                            className="text-sm text-zinc-600 dark:text-zinc-400 block mb-2"
                          >
                            {t(
                              'settings.tabs.language_.description',
                              'Select your preferred language',
                            )}
                          </label>

                          <div
                            ref={dropdownRef}
                            className="relative inline-block w-full max-w-xs"
                          >
                            <button
                              id="language-select"
                              type="button"
                              onClick={() => setIsLanguageOpen((prev) => !prev)}
                              className="w-full px-4 py-2 rounded-lg text-sm font-medium
        bg-zinc-100 dark:bg-zinc-800 
        text-zinc-800 dark:text-zinc-200 
        border border-zinc-200 dark:border-zinc-700 
        hover:bg-zinc-200 dark:hover:bg-zinc-700
        focus:outline-none focus:ring-2 focus:ring-blue-500
        transition-all duration-200 flex items-center justify-between"
                              aria-haspopup="listbox"
                              aria-expanded={isLanguageOpen}
                            >
                              {i18n.language.startsWith('zh')
                                ? '简体中文 (zh-CN)'
                                : 'English (en-US)'}
                              <svg
                                className={`w-4 h-4 transition-transform duration-200 ${
                                  isLanguageOpen ? 'rotate-180' : ''
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 9l-7 7-7-7"
                                />
                              </svg>
                            </button>

                            {isLanguageOpen && (
                              <ul
                                className="absolute mt-1 w-full bg-white dark:bg-zinc-800 
          border border-zinc-200 dark:border-zinc-700 
          rounded-lg shadow-lg z-10 overflow-hidden
          text-sm font-medium"
                              >
                                <li>
                                  <button
                                    type="button"
                                    className={`w-full px-4 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors
              ${i18n.language.startsWith('zh') ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-zinc-700 dark:text-zinc-300'}`}
                                    onClick={() => {
                                      i18n.changeLanguage('zh');
                                      setIsLanguageOpen(false);
                                    }}
                                    role="option"
                                    aria-selected={i18n.language.startsWith(
                                      'zh',
                                    )}
                                  >
                                    简体中文 (zh-CN)
                                  </button>
                                </li>
                                <li>
                                  <button
                                    type="button"
                                    className={`w-full px-4 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors
              ${i18n.language.startsWith('en') ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-zinc-700 dark:text-zinc-300'}`}
                                    onClick={() => {
                                      i18n.changeLanguage('en');
                                      setIsLanguageOpen(false);
                                    }}
                                    role="option"
                                    aria-selected={i18n.language.startsWith(
                                      'en',
                                    )}
                                  >
                                    English (en-US)
                                  </button>
                                </li>
                              </ul>
                            )}
                          </div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                            {t(
                              'settings.tabs.language_.current',
                              'Current language:',
                            )}{' '}
                            <span className="font-medium">
                              {i18n.language.startsWith('zh')
                                ? '简体中文 (zh-CN)'
                                : 'English (en-US)'}
                            </span>
                          </div>
                        </div>
                        <div>
                          <h6 className="font-bold text-zinc-800 dark:text-zinc-200">
                            {t('settings.tabs.theme')}
                          </h6>
                          <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                            {t('settings.tabs.theme_.description')}
                          </div>
                          <div className="flex flex-wrap gap-3">
                            {(['light', 'dark', 'system'] as const).map(
                              (item) => (
                                <button
                                  key={item}
                                  type="button"
                                  className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 capitalize
              ${
                theme === item
                  ? 'bg-blue-600 text-white shadow-md scale-105'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }
            `}
                                  onClick={() => setTheme(item)}
                                >
                                  {item === 'light' &&
                                    t('settings.tabs.theme_.light')}
                                  {item === 'dark' &&
                                    t('settings.tabs.theme_.dark')}
                                  {item === 'system' &&
                                    t('settings.tabs.theme_.auto')}
                                </button>
                              ),
                            )}
                          </div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                            {t('settings.tabs.theme_.auto_.description')}
                            {theme === 'system' && (
                              <span className="ml-2">
                                {t('settings.tabs.theme_.now')}
                                {resolvedTheme === 'dark'
                                  ? t('settings.tabs.theme_.dark')
                                  : t('settings.tabs.theme_.light')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'chat' && (
                      <div className="space-y-6">
                        <div className="text-sm text-zinc-600 dark:text-zinc-400">
                          {t('settings.tabs.chat_.description')}
                        </div>

                        <div>
                          <label
                            htmlFor="system-prompt"
                            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
                          >
                            {t('settings.tabs.chat_.system_prompt')}
                          </label>
                          <textarea
                            id="system-prompt"
                            disabled={saving}
                            className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[80px]"
                            placeholder={t(
                              'settings.tabs.chat_.system_prompt_.placeholder',
                            )}
                            ref={textareaRef}
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                            rows={4}
                          />
                          <div className="text-xs text-zinc-400 mt-1">
                            {t(
                              'settings.tabs.chat_.system_prompt_.description',
                            )}
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            type="button"
                            disabled={saving || systemPrompt === originalPrompt}
                            className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-800 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                            onClick={async () => {
                              try {
                                const res = await fetch(
                                  '/api/user/system-prompt',
                                );
                                if (res.ok) {
                                  const session = await res.json();
                                  setSystemPrompt(session?.systemPrompt || '');
                                } else {
                                  toast({
                                    type: 'error',
                                    description: t(
                                      'settings.tabs.chat_.system_prompt_.cant_load',
                                    ),
                                  });
                                }
                              } catch (err) {
                                toast({
                                  type: 'error',
                                  description: t('network.error'),
                                });
                              }
                            }}
                          >
                            {t('button.cencel')}
                          </button>
                          <button
                            type="button"
                            disabled={saving || systemPrompt === originalPrompt}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-md hover:shadow-lg"
                            onClick={async () => {
                              setSaving(true);
                              try {
                                await saveSystemPromptToDB(systemPrompt);
                                setOriginalPrompt(systemPrompt);
                                toast({
                                  type: 'success',
                                  description: t(
                                    'settings.tabs.chat_.system_prompt_.save.success',
                                  ),
                                });
                              } catch {
                                toast({
                                  type: 'error',
                                  description: t(
                                    'settings.tabs.chat_.system_prompt_.save.fail',
                                  ),
                                });
                              } finally {
                                setSaving(false);
                              }
                            }}
                          >
                            {saving
                              ? t('settings.tabs.chat_.system_prompt_.save.ing')
                              : t('button.save')}
                          </button>
                        </div>

                        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700">
                          <button
                            type="button"
                            className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors w-fit"
                            onClick={() => setIsDeleteDialogOpen(true)}
                            disabled={saving}
                          >
                            {saving
                              ? t('settings.tabs.chat_.clean.ing')
                              : t('settings.tabs.chat_.clean.button')}
                          </button>
                          <div className="text-xs text-zinc-400 mt-1">
                            {t('settings.tabs.chat_.clean.warn')}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'user' && (
                      <div className="space-y-6">
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                          {t('settings.tabs.user_.description')}
                        </p>

                        <div className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
                          <Image
                            src={`https://www.gravatar.com/avatar/${md5((user.email ?? '').toLowerCase())}?d=identicon&s=64`}
                            alt={user.email ?? t('settings.tabs.user_.avatar')}
                            width={64}
                            height={64}
                            className="rounded-full border border-zinc-200 dark:border-zinc-700"
                          />

                          <div className="flex-1">
                            {!isEditing ? (
                              <div>
                                <div className="font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-1 group">
                                  <span className="text-sm">
                                    {session?.user?.nick
                                      ? session.user.nick
                                      : user.email}
                                  </span>
                                  <button
                                    type="button"
                                    className="w-4 h-4 opacity-0 group-hover:opacity-40 hover:opacity-100 text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                                    aria-label={t(
                                      'settings.tabs.user_.nick.edit',
                                    )}
                                    onClick={() => setIsEditing(true)}
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className="w-4 h-4"
                                    >
                                      <path d="M12 20h9" />
                                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                    </svg>
                                  </button>
                                </div>
                                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                  {user.email}
                                </div>
                              </div>
                            ) : (
                              <NicknameEditor
                                initialNick={session?.user?.nick ?? ''}
                                userId={user.id ?? ''}
                                onSave={() => {
                                  setIsEditing(false);
                                  console.debug(
                                    `[DEBUG] Nick: ${session?.user?.nick}`,
                                  );
                                  toast({
                                    type: 'success',
                                    description: t(
                                      'settings.tabs.user_.nick.update.success',
                                    ),
                                  });
                                }}
                                onCancel={() => setIsEditing(false)}
                              />
                            )}

                            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                              {t('settings.tabs.user_.avatar_.description')}
                              <a
                                href="https://www.gravatar.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline text-blue-600 dark:text-blue-400"
                              >
                                {t('settings.tabs.user_.avatar_.gravatar')}
                              </a>
                              {t('settings.tabs.user_.avatar_.description_')}
                            </div>
                          </div>
                        </div>

                        <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
                          <button
                            type="button"
                            className="w-full px-4 py-3 text-left font-medium text-sm bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors flex items-center justify-between"
                            onClick={() => {
                              const el = document.getElementById(
                                'password-form-panel',
                              );
                              el?.classList.toggle('hidden');
                            }}
                          >
                            {t('settings.tabs.user_.change_password.title')}
                            <ChevronUp
                              className="transform transition-transform duration-200 text-zinc-500 dark:text-zinc-400"
                              size={16}
                            />
                          </button>
                          <div
                            id="password-form-panel"
                            className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-700 hidden"
                          >
                            <form
                              className="space-y-3"
                              onSubmit={async (e) => {
                                e.preventDefault();
                                const form = e.target as HTMLFormElement;
                                const oldPassword = (
                                  form.elements.namedItem(
                                    'oldPassword',
                                  ) as HTMLInputElement
                                ).value;
                                const newPassword = (
                                  form.elements.namedItem(
                                    'newPassword',
                                  ) as HTMLInputElement
                                ).value;

                                if (!oldPassword || !newPassword) return;

                                const passwordRegex =
                                  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&\-_=+<>.,:;^~{}[\]()|\\'"`])/;
                                if (
                                  newPassword.length < 8 ||
                                  newPassword.length > 32 ||
                                  !passwordRegex.test(newPassword)
                                ) {
                                  toast({
                                    type: 'error',
                                    description: t('password.not_compliant'),
                                  });
                                  return;
                                }

                                setSaving(true);
                                try {
                                  const res = await fetch(
                                    '/api/user/update-password',
                                    {
                                      method: 'POST',
                                      headers: {
                                        'Content-Type': 'application/json',
                                      },
                                      body: JSON.stringify({
                                        oldPassword,
                                        newPassword,
                                      }),
                                    },
                                  );

                                  if (res.ok) {
                                    toast({
                                      type: 'success',
                                      description: t(
                                        'settings.tabs.user_.change_password.success',
                                      ),
                                    });
                                    safeSignOut({
                                      redirectTo: '/',
                                      jti: session?.user.jti,
                                    });
                                  } else {
                                    const data = await res
                                      .json()
                                      .catch(() => ({}));
                                    toast({
                                      type: 'error',
                                      description:
                                        data?.error ||
                                        t(
                                          'settings.tabs.user_.change_password.fail',
                                        ),
                                    });
                                  }
                                } catch (err) {
                                  toast({
                                    type: 'error',
                                    description: t('network.error'),
                                  });
                                } finally {
                                  setSaving(false);
                                }
                              }}
                            >
                              <label
                                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                                htmlFor="oldPassword"
                              >
                                {t(
                                  'settings.tabs.user_.change_password.current_password',
                                )}
                              </label>
                              <input
                                placeholder={t(
                                  'settings.tabs.user_.change_password.current_password_placeholder',
                                )}
                                type="password"
                                id="oldPassword"
                                name="oldPassword"
                                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                                disabled={saving}
                              />
                              <label
                                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                                htmlFor="newPassword"
                              >
                                {t(
                                  'settings.tabs.user_.change_password.new_password',
                                )}
                              </label>
                              <input
                                placeholder={t('password.not_compliant')}
                                type="password"
                                id="newPassword"
                                name="newPassword"
                                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                                disabled={saving}
                              />
                              <button
                                type="submit"
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-md hover:shadow-lg mt-2"
                                disabled={saving}
                              >
                                {saving
                                  ? t(
                                      'settings.tabs.user_.change_password.save.ing',
                                    )
                                  : t(
                                      'settings.tabs.user_.change_password.title',
                                    )}
                              </button>
                            </form>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'about' && (
                      <div>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                          {renderWithLineBreaks(t('website.about'))}
                          <a
                            href="https://github.com/At87668/NextWebUI"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs mt-2 underline text-blue-600 dark:text-blue-400"
                          >
                            Github
                          </a>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <AlertDialog
                  open={isDeleteDialogOpen}
                  onOpenChange={setIsDeleteDialogOpen}
                >
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {t('components.sidebar_history.delete.dialog.title')}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {t(
                          'components.sidebar_history.delete.dialog.description',
                        )}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>
                        {t('button.cencel')}
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={async () => {
                          if (!session?.user?.id) {
                            toast({
                              type: 'error',
                              description: t(
                                'components.sidebar_history.delete.invalid_session',
                              ),
                            });
                            return;
                          }
                          setSaving(true);
                          try {
                            const res = await fetch(
                              '/api/user/delete-all-chat',
                              {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  userId: session.user.id,
                                }),
                              },
                            );
                            if (res.ok) {
                              toast({
                                type: 'success',
                                description: t(
                                  'settings.tabs.chat_.clean.success',
                                ),
                              });
                              router.refresh();
                            } else {
                              toast({
                                type: 'error',
                                description: t(
                                  'settings.tabs.chat_.clean.fail',
                                ),
                              });
                            }
                          } catch (err) {
                            toast({
                              type: 'error',
                              description: t('network.error'),
                            });
                          } finally {
                            setSaving(false);
                            setIsDeleteDialogOpen(false);
                          }
                        }}
                      >
                        {t('button.continue')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>,
            document.body,
          )}
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

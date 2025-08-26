import type { Chat } from '@/lib/db/schema';
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from './ui/sidebar';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  CheckCircleFillIcon,
  GlobeIcon,
  PencilEditIcon,
  LockIcon,
  MoreHorizontalIcon,
  ShareIcon,
  TrashIcon,
} from './icons';
import { memo, useRef, useState } from 'react';
import { useChatVisibility } from '@/hooks/use-chat-visibility';
import { isMobile } from 'react-device-detect';
import { useTranslation } from 'react-i18next';
import '@/i18n/index';

const PureChatItem = ({
  chat,
  isActive,
  onDelete,
  setOpenMobile,
}: {
  chat: Chat;
  isActive: boolean;
  onDelete: (chatId: string) => void;
  setOpenMobile: (open: boolean) => void;
}) => {
  const { t } = useTranslation();
  const { visibilityType, setVisibilityType } = useChatVisibility({
    chatId: chat.id,
    initialVisibilityType: chat.visibility,
  });

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(chat.title);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleTitleSave() {
    if (title.trim() && title !== chat.title) {
      await fetch('/api/chat/update-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: chat.id, title }),
      });
    }
    setEditing(false);
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive}>
        {editing ? (
          <input
            ref={inputRef}
            className="w-full bg-transparent outline-none border-b border-sidebar-accent px-1 text-sm"
            value={title}
            autoFocus
            maxLength={40}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleTitleSave();
              } else if (e.key === 'Escape') {
                setTitle(chat.title);
                setEditing(false);
              }
            }}
            aria-label={t('components.sidebar_history_item.chat_title.edit')}
            role="textbox"
          />
        ) : (
          <Link
            href={`/chat/${chat.id}`}
            onClick={() => setOpenMobile(false)}
            onDoubleClick={(e) => {
              e.preventDefault();
              setEditing(true);
              setTimeout(() => inputRef.current?.focus(), 0);
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              const timer: NodeJS.Timeout = setTimeout(() => {
                setEditing(true);
                setTimeout(() => inputRef.current?.focus(), 0);
              }, 600);
              const clear = () => clearTimeout(timer);
              e.currentTarget.addEventListener('touchend', clear, {
                once: true,
              });
              e.currentTarget.addEventListener('touchmove', clear, {
                once: true,
              });
              e.currentTarget.addEventListener('touchcancel', clear, {
                once: true,
              });
            }}
            onContextMenu={(e) => {
              if (isMobile) {
                e.preventDefault();
              }
            }}
            tabIndex={0}
            aria-label={`${t('components.sidebar_history_item.chat.open')} ${title}`}
          >
            <span>{title}</span>
          </Link>
        )}
      </SidebarMenuButton>

      <DropdownMenu modal={true}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground mr-0.5"
            showOnHover={!isActive}
          >
            <MoreHorizontalIcon />
            <span className="sr-only">{t('button.more')}</span>
          </SidebarMenuAction>
        </DropdownMenuTrigger>

        <DropdownMenuContent side="bottom" align="end">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="cursor-pointer">
              <ShareIcon />
              <span>{t('button.share')}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  className="cursor-pointer flex-row justify-between"
                  onClick={() => {
                    setVisibilityType('private');
                  }}
                >
                  <div className="flex flex-row gap-2 items-center">
                    <LockIcon size={12} />
                    <span>{t('button.private')}</span>
                  </div>
                  {visibilityType === 'private' ? (
                    <CheckCircleFillIcon />
                  ) : null}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer flex-row justify-between"
                  onClick={() => {
                    setVisibilityType('public');
                  }}
                >
                  <div className="flex flex-row gap-2 items-center">
                    <GlobeIcon />
                    <span>{t('button.public')}</span>
                  </div>
                  {visibilityType === 'public' ? <CheckCircleFillIcon /> : null}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>

          <DropdownMenuItem
            className="cursor-pointer"
            onSelect={() => setEditing(true)}
          >
            <PencilEditIcon />
            <span>{t('button.edit')}</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer text-destructive focus:bg-destructive/15 focus:text-destructive dark:text-red-500"
            onSelect={() => onDelete(chat.id)}
          >
            <TrashIcon />
            <span>{t('button.delete')}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
};

export const ChatItem = memo(PureChatItem, (prevProps, nextProps) => {
  if (prevProps.isActive !== nextProps.isActive) return false;
  return true;
});

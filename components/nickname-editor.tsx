'use client';

import { useState } from 'react';
import { toast } from './toast';
import { useSession } from 'next-auth/react';
import { useTranslation } from 'react-i18next';
import '@/i18n/index';

interface NicknameEditorProps {
  initialNick: string;
  userId: string;
  onSave?: (nick: string) => void;
}

export function NicknameEditor({
  initialNick,
  userId,
  onSave,
  onCancel,
}: NicknameEditorProps & { onCancel: () => void }) {
  const { t } = useTranslation();
  const [nick, setNick] = useState(initialNick);
  const [saving, setSaving] = useState(false);
  const { update } = useSession();

  const handleSave = async () => {
    if (!nick.trim()) {
      toast({
        type: 'error',
        description: t('components.nickname_editor.empty'),
      });
      return;
    }
    if (nick === initialNick) {
      onCancel();
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/user/update-nick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, nick }),
      });
      const data = await res.json();
      if (res.ok) {
        onSave?.(nick);
        await update({
          nick,
        });
      } else {
        toast({
          type: 'error',
          description:
            data.error || t('components.nickname_editor.update.fali'),
        });
      }
    } catch (err) {
      toast({ type: 'error', description: t('network.error') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2 mt-1">
      <input
        type="text"
        value={nick}
        onChange={(e) => setNick(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave();
          if (e.key === 'Escape') onCancel();
        }}
        className="flex-1 px-2 py-1 text-sm border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
        maxLength={20}
        autoFocus
        disabled={saving}
      />
      <button
        type="button"
        disabled={saving}
        onClick={handleSave}
        className="w-6 h-6 flex items-center justify-center text-green-600 hover:bg-green-100 dark:hover:bg-green-900 rounded transition-colors disabled:opacity-50"
        aria-label={t('button.save')}
      >
        ✓
      </button>
      <button
        type="button"
        disabled={saving}
        onClick={onCancel}
        className="w-6 h-6 flex items-center justify-center text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors"
        aria-label={t('button.cencel')}
      >
        ×
      </button>
    </div>
  );
}

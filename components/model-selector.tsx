'use client';

import { startTransition, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { CheckCircleFillIcon, ChevronDownIcon } from './icons';
import { useTranslation } from 'react-i18next';
import { saveChatModelAsCookie } from '@/app/(chat)/actions';
import '@/i18n/index';

interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export function ModelSelector(
  props: {
    selectedModelId: string;
  } & React.ComponentProps<typeof Button>
) {
  const { selectedModelId, className } = props;
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [optimisticModelId, setOptimisticModelId] = useState(selectedModelId);
  const [availableChatModels, setAvailableChatModels] = useState<ChatModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchModels() {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/ai/models');
        
        if (!response.ok) {
          throw Error('Failed to fetch models');
        }
        
        const models: ChatModel[] = await response.json();
        setAvailableChatModels(models);
        
        const isValidModel = models.some(m => m.id === optimisticModelId);
        if (!isValidModel && models.length > 0) {
          const newModelId = models[0].id;
          setOptimisticModelId(newModelId);
          saveChatModelAsCookie(newModelId);
        }
      } catch (err) {
        console.error('Error fetching models:', err);
        setError('Failed to load models');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchModels();
  }, []);

  useEffect(() => {
    setOptimisticModelId(selectedModelId);
  }, [selectedModelId]);

  const selectedChatModel = availableChatModels.find(m => m.id === optimisticModelId);

  const handleModelSelect = (id: string) => {
    setOpen(false);
    
    startTransition(() => {
      setOptimisticModelId(id);
      saveChatModelAsCookie(id);
    });
  };

  if (isLoading) {
    return (
      <Button variant="outline" className="md:px-2 md:h-[34px]">
        {t('components.model-selector.loading')}
        <ChevronDownIcon />
      </Button>
    );
  }

  if (error || availableChatModels.length === 0) {
    return (
      <Button variant="outline" className="md:px-2 md:h-[34px] text-red-500">
        {error || t('components.model-selector.no_models')}
      </Button>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        asChild
        className={cn(
          'w-fit data-[state=open]:bg-accent data-[state=open]:text-accent-foreground',
          className,
        )}
      >
        <Button
          data-testid="model-selector"
          variant="outline"
          className="md:px-2 md:h-[34px]"
        >
          {selectedChatModel?.name || optimisticModelId}
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[300px]">
        {availableChatModels.map((chatModel) => (
          <DropdownMenuItem
            data-testid={`model-selector-item-${chatModel.id}`}
            key={chatModel.id}
            onSelect={() => handleModelSelect(chatModel.id)}
            data-active={chatModel.id === optimisticModelId}
            asChild
          >
            <button
              type="button"
              className="gap-4 group/item flex flex-row justify-between items-center w-full"
            >
              <div className="flex flex-col gap-1 items-start">
                <div>{chatModel.name}</div>
                <div className="text-xs text-muted-foreground">
                  {t(chatModel.description)}
                </div>
              </div>

              <div className="text-foreground dark:text-foreground opacity-0 group-data-[active=true]/item:opacity-100">
                <CheckCircleFillIcon />
              </div>
            </button>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
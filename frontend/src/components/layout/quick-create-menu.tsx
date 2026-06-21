'use client';

import { useState } from 'react';
import {
  Plus,
  Briefcase,
  ListChecks,
  FileText,
  CalendarDays,
  X,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { CaseForm } from '@/components/forms/case-form';
import { TaskForm } from '@/components/forms/task-form';
import { DocumentUploadForm } from '@/components/forms/document-upload-form';
import { CalendarEventForm } from '@/components/forms/calendar-event-form';
import { toast } from '@/lib/toast';

interface QuickCreateMenuProps {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}

type SubModal = 'case' | 'task' | 'document' | 'event' | null;

const ITEMS: {
  key: Exclude<SubModal, null>;
  label: string;
  icon: typeof Briefcase;
}[] = [
  { key: 'case', label: 'Новое дело', icon: Briefcase },
  { key: 'task', label: 'Новая задача', icon: ListChecks },
  { key: 'document', label: 'Новый документ', icon: FileText },
  { key: 'event', label: 'Новое событие', icon: CalendarDays },
];

const TITLES: Record<Exclude<SubModal, null>, string> = {
  case: 'Новое дело',
  task: 'Новая задача',
  document: 'Новый документ',
  event: 'Новое событие',
};

export function QuickCreateMenu({
  open,
  onToggle,
  onClose,
}: QuickCreateMenuProps) {
  const [subModal, setSubModal] = useState<SubModal>(null);

  function openSubModal(key: Exclude<SubModal, null>) {
    onClose();
    setSubModal(key);
  }

  function handleSuccess(message: string) {
    setSubModal(null);
    toast.success(message);
  }

  return (
    <>
      {open && <div className="fixed inset-0 z-40" onClick={onClose} />}

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-60 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          {ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => openSubModal(item.key)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-foreground transition hover:bg-accent"
              >
                <Icon size={16} className="text-primary" />
                {item.label}
              </button>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={onToggle}
        aria-label={open ? 'Закрыть меню создания' : 'Быстрое создание'}
        title="Быстрое создание"
        className="fixed bottom-6 right-6 z-50 flex h-[50px] w-[50px] items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl transition hover:opacity-90 hover:scale-105"
      >
        {open ? <X size={22} /> : <Plus size={24} />}
      </button>

      <Modal
        open={subModal === 'case'}
        onClose={() => setSubModal(null)}
        title={TITLES.case}
      >
        <CaseForm onSuccess={() => handleSuccess('Дело создано')} />
      </Modal>

      <Modal
        open={subModal === 'task'}
        onClose={() => setSubModal(null)}
        title={TITLES.task}
      >
        <TaskForm onSuccess={() => handleSuccess('Задача создана')} />
      </Modal>

      <Modal
        open={subModal === 'document'}
        onClose={() => setSubModal(null)}
        title={TITLES.document}
      >
        <DocumentUploadForm
          onSuccess={() => handleSuccess('Документ загружен')}
        />
      </Modal>

      <Modal
        open={subModal === 'event'}
        onClose={() => setSubModal(null)}
        title={TITLES.event}
      >
        <CalendarEventForm
          onSuccess={() => handleSuccess('Событие создано')}
        />
      </Modal>
    </>
  );
}

// Файл 2 (НОВЫЙ): frontend/src/components/search/command-palette.tsx
'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileText, Users, ArrowRight } from 'lucide-react';

import { searchApi } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { navigation } from '@/components/layout/sidebar';

interface SearchClient {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
}

interface SearchCase {
  id: string;
  title: string;
  description?: string;
  client?: { id: string; fullName: string };
  stage?: { id: string; name: string; color?: string };
}

interface SearchResponse {
  query: string;
  clients: SearchClient[];
  cases: SearchCase[];
  total: { clients: number; cases: number };
}

interface PaletteItem {
  key: string;
  group: 'Переход' | 'Клиенты' | 'Дела';
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  onSelect: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trimmedQuery = query.trim();
  const isSearchMode = trimmedQuery.length >= MIN_QUERY_LENGTH;

  // Сброс состояния и фокус на инпут при открытии
  useEffect(() => {
    if (open) {
      setQuery('');
      setResults(null);
      setSelectedIndex(0);

      const timer = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Закрытие по Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Debounce-поиск
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!isSearchMode) {
      setResults(null);
      setLoading(false);
      return;
    }

    const token = getAccessToken();
    if (!token) return;

    setLoading(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const data = await searchApi.search(trimmedQuery, token);
        setResults(data as SearchResponse);
      } catch {
        setResults(null);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trimmedQuery, isSearchMode]);

  function go(path: string) {
    router.push(path);
    onClose();
  }

  // Список пунктов быстрой навигации (фильтруется по запросу, если он короткий)
  const navItems: PaletteItem[] = useMemo(() => {
    const items = navigation.filter((item) =>
      query.length === 0
        ? true
        : item.label.toLowerCase().includes(query.toLowerCase()),
    );

    return items.map((item) => ({
      key: `nav-${item.href}`,
      group: 'Переход',
      label: item.label,
      icon: <ArrowRight size={16} className="shrink-0 text-muted-foreground" />,
      onSelect: () => go(item.href),
    }));
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  const clientItems: PaletteItem[] = useMemo(() => {
    if (!results) return [];

    return results.clients.map((client) => ({
      key: `client-${client.id}`,
      group: 'Клиенты',
      label: client.fullName,
      sublabel: client.email || client.phone || undefined,
      icon: <Users size={16} className="shrink-0 text-muted-foreground" />,
      onSelect: () => go(`/clients/${client.id}`),
    }));
  }, [results]); // eslint-disable-line react-hooks/exhaustive-deps

  const caseItems: PaletteItem[] = useMemo(() => {
    if (!results) return [];

    return results.cases.map((c) => ({
      key: `case-${c.id}`,
      group: 'Дела',
      label: c.title,
      sublabel: [c.client?.fullName, c.stage?.name].filter(Boolean).join(' · ') || undefined,
      icon: <FileText size={16} className="shrink-0 text-muted-foreground" />,
      onSelect: () => go(`/cases/${c.id}`),
    }));
  }, [results]); // eslint-disable-line react-hooks/exhaustive-deps

  // Итоговый плоский список для клавиатурной навигации
  const items: PaletteItem[] = isSearchMode
    ? [...clientItems, ...caseItems]
    : navItems;

  useEffect(() => {
    setSelectedIndex(0);
  }, [items.length, query]);

  function handleInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, Math.max(items.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = items[selectedIndex];
      if (item) item.onSelect();
    }
  }

  if (!open) return null;

  // Группировка для рендера (сохраняя порядок групп)
  const groups: { name: string; items: PaletteItem[] }[] = isSearchMode
    ? [
        { name: 'Клиенты', items: clientItems },
        { name: 'Дела', items: caseItems },
      ].filter((g) => g.items.length > 0)
    : [{ name: 'Быстрый переход', items: navItems }];

  let runningIndex = -1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-4 pt-[12vh]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search size={18} className="shrink-0 text-muted-foreground" />

          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Найти дело или клиента..."
            className="h-14 w-full bg-transparent outline-none placeholder:text-muted-foreground"
          />

          <kbd className="hidden shrink-0 rounded-md border border-border px-1.5 py-0.5 text-xs text-muted-foreground sm:block">
            Esc
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {isSearchMode && loading && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Поиск...
            </div>
          )}

          {isSearchMode && !loading && items.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Ничего не найдено по запросу «{trimmedQuery}»
            </div>
          )}

          {(!isSearchMode || !loading) &&
            groups.map((group) => (
              <div key={group.name} className="mb-2">
                <div className="px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {group.name}
                </div>

                {group.items.map((item) => {
                  runningIndex += 1;
                  const isSelected = runningIndex === selectedIndex;

                  return (
                    <button
                      key={item.key}
                      type="button"
                      onMouseEnter={() => setSelectedIndex(runningIndex)}
                      onClick={item.onSelect}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                        isSelected ? 'bg-accent' : 'hover:bg-accent/50'
                      }`}
                    >
                      {item.icon}

                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">
                          {item.label}
                        </div>

                        {item.sublabel && (
                          <div className="truncate text-xs text-muted-foreground">
                            {item.sublabel}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}

          {!isSearchMode && query.length > 0 && navItems.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Введите ещё символ для поиска дел и клиентов
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 border-t border-border px-4 py-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border px-1">↑↓</kbd>
            навигация
          </span>

          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border px-1">Enter</kbd>
            перейти
          </span>
        </div>
      </div>
    </div>
  );
    }

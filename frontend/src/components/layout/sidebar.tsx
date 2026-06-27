'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  X,
  LayoutDashboard,
  Briefcase,
  Users,
  ClipboardList,
  Layers,
  Kanban,
  ListChecks,
  FileText,
  CalendarDays,
  ScrollText,
  Settings,
  Plus,
} from 'lucide-react';
import { casesApi, notificationsApi } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { Modal } from '@/components/ui/modal';
import { CaseForm } from '@/components/forms/case-form';
import { toast } from '@/lib/toast';

export const navigation = [
  { label: 'Панель управления', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Дела',             href: '/cases',     icon: Briefcase },
  { label: 'Клиенты',          href: '/clients',   icon: Users },
  { label: 'Типы дел',         href: '/case-types',icon: ClipboardList },
  { label: 'Стадии',           href: '/stages',    icon: Layers },
  { label: 'Воронка дел',      href: '/pipeline',  icon: Kanban },
  { label: 'Задачи',           href: '/tasks',     icon: ListChecks },
  { label: 'Документы',        href: '/documents', icon: FileText },
  { label: 'Календарь',        href: '/calendar',  icon: CalendarDays },
  { label: 'Журнал аудита',    href: '/audit',     icon: ScrollText },
];

const MAX_SIDEBAR_CASES = 8;

interface CaseSummary { id: string; title: string; }
interface NotificationTask { case?: { id: string; title: string }; }

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

function dotColor(urgency: 'overdue' | 'soon' | 'ok') {
  if (urgency === 'overdue') return 'bg-red-500';
  if (urgency === 'soon') return 'bg-amber-500';
  return 'bg-emerald-500';
}

function SidebarContent({ onItemClick }: { onItemClick?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [urgency, setUrgency] = useState<Record<string, 'overdue' | 'soon' | 'ok'>>({});
  const [loadingCases, setLoadingCases] = useState(true);
  const [showCaseForm, setShowCaseForm] = useState(false);

  async function loadCases() {
    const token = getAccessToken();
    if (!token) return;
    try {
      const [casesData, notificationsData] = await Promise.all([
        casesApi.getAll(token),
        notificationsApi.getAll(token),
      ]);

      const caseList = casesData as CaseSummary[];
      setCases(caseList);

      const notif = notificationsData as {
        overdue: NotificationTask[];
        upcoming: NotificationTask[];
      };

      const map: Record<string, 'overdue' | 'soon' | 'ok'> = {};
      notif.upcoming?.forEach((task) => {
        if (task.case) map[task.case.id] = 'soon';
      });
      notif.overdue?.forEach((task) => {
        if (task.case) map[task.case.id] = 'overdue';
      });
      setUrgency(map);
    } catch {
      // silently fail
    } finally {
      setLoadingCases(false);
    }
  }

  useEffect(() => {
    loadCases();
  }, []);

  const visibleCases = cases.slice(0, MAX_SIDEBAR_CASES);
  const hasMoreCases = cases.length > MAX_SIDEBAR_CASES;

  return (
    <>
      <nav className="flex-1 space-y-6 overflow-y-auto p-4">
        <div>
          <div className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Навигация
          </div>
          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href ||
                pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onItemClick}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
                    active
                      ? 'bg-primary/10 font-semibold text-primary'
                      : 'text-foreground/80 hover:bg-accent'
                  }`}
                >
                  <Icon size={16} className="shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Дела
          </div>
          <div className="space-y-1">
            {loadingCases ? (
              <div className="space-y-2 px-2 py-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-6 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            ) : visibleCases.length === 0 ? (
              <p className="px-3 py-1 text-xs text-muted-foreground">Дел пока нет</p>
            ) : (
              visibleCases.map((c) => {
                const active = pathname === `/cases/${c.id}`;
                const state = urgency[c.id] ?? 'ok';
                return (
                  <Link
                    key={c.id}
                    href={`/cases/${c.id}`}
                    onClick={onItemClick}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-[13px] transition ${
                      active
                        ? 'bg-primary/10 font-semibold text-primary'
                        : 'text-foreground/80 hover:bg-accent'
                    }`}
                  >
                    <span className={`h-[7px] w-[7px] shrink-0 rounded-full ${dotColor(state)}`} />
                    <span className="truncate">{c.title}</span>
                  </Link>
                );
              })
            )}
            {hasMoreCases && (
              <button
                type="button"
                onClick={() => { onItemClick?.(); router.push('/cases'); }}
                className="w-full px-3 py-1.5 text-left text-xs text-primary hover:underline"
              >
                Все дела →
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowCaseForm(true)}
              className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2 text-xs text-muted-foreground transition hover:border-primary hover:text-primary"
            >
              <Plus size={13} />
              Новое дело
            </button>
          </div>
        </div>

        <div>
          <div className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Система
          </div>
          <Link
            href="/settings"
            onClick={onItemClick}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
              pathname === '/settings' || pathname.startsWith('/settings/')
                ? 'bg-primary/10 font-semibold text-primary'
                : 'text-foreground/80 hover:bg-accent'
            }`}
          >
            <Settings size={16} className="shrink-0" />
            Настройки
          </Link>
        </div>
      </nav>

      <Modal open={showCaseForm} onClose={() => setShowCaseForm(false)} title="Новое дело">
        <CaseForm
          onSuccess={() => {
            setShowCaseForm(false);
            toast.success('Дело создано');
            loadCases();
          }}
        />
      </Modal>
    </>
  );
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  return (
    <>
      <aside className="hidden md:flex md:w-72 md:flex-col border-r border-border bg-card">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onMobileClose} />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col bg-card shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-border px-4">
              <Link
                href="/dashboard"
                className="flex items-center gap-2"
                onClick={onMobileClose}
              >
                <img src="/logo-mark.svg" alt="" className="h-7 w-7" />
                <span className="font-bold">
                  Case<span className="text-primary">Flow</span>
                </span>
              </Link>
              <button
                type="button"
                aria-label="Закрыть меню"
                onClick={onMobileClose}
                className="shrink-0 rounded-lg p-2 hover:bg-accent"
              >
                <X size={20} />
              </button>
            </div>
            <SidebarContent onItemClick={onMobileClose} />
          </aside>
        </div>
      )}
    </>
  );
          }

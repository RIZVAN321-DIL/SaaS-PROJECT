'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

import { AppShell } from '@/components/layout/app-shell';
import { casesApi } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';

import { CaseHeader } from '@/components/cases/case-header';
import { CaseTabs } from '@/components/cases/case-tabs';
import { CaseOverview } from '@/components/cases/case-overview';

interface CaseDetail {
  id: string;
  title: string;
  description?: string;

  client?: {
    id: string;
    fullName: string;
  };

  caseType?: {
    id: string;
    name: string;
  };

  stage?: {
    id: string;
    name: string;
  };

  tasks?: unknown[];
  documents?: unknown[];

  createdAt: string;
  updatedAt?: string;
}

export async function generateStaticParams() {
  return [];
}

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  async function loadCase() {
    try {
      const token = getAccessToken();
      if (!token || !id) return;

      const data = await casesApi.getById(id, token);
      setCaseData(data as CaseDetail);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCase();
  }, [id]);

  if (loading) {
    return (
      <AppShell>
        <div className="p-8 text-center">Загрузка...</div>
      </AppShell>
    );
  }

  if (!caseData) {
    return (
      <AppShell>
        <div className="p-8 text-center">Дело не найдено</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <CaseHeader caseData={caseData} />

        <CaseTabs activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === 'overview' && (
          <CaseOverview caseData={caseData} />
        )}
      </div>
    </AppShell>
  );
}

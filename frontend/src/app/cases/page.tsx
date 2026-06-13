'use client';

import { useEffect, useState } from 'react';

import { AppShell } from '@/components/layout/app-shell';
import { casesApi } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';

interface CaseItem {
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

  createdAt: string;
}

export default function CasesPage() {
  const [cases, setCases] =
    useState<CaseItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function load() {
      try {
        const token =
          getAccessToken();

        if (!token) {
          return;
        }

        const data =
          await casesApi.getAll(
            token,
          );

        setCases(
          data as CaseItem[],
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <AppShell>
      <div className="space-y-6">
        <div
          className="
            flex
            items-center
            justify-between
          "
        >
          <div>
            <h1 className="text-3xl font-bold">
              Cases
            </h1>

            <p className="text-muted-foreground">
              Legal case management
            </p>
          </div>

          <button
            className="
              rounded-xl
              bg-primary
              px-5
              py-3
              text-sm
              font-medium
              text-primary-foreground
            "
          >
            New Case
          </button>
        </div>

        <div
          className="
            overflow-hidden
            rounded-2xl
            border
            border-border
            bg-card
          "
        >
          <table className="w-full">
            <thead>
              <tr
                className="
                  border-b
                  border-border
                "
              >
                <th className="p-4 text-left">
                  Title
                </th>

                <th className="p-4 text-left">
                  Client
                </th>

                <th className="p-4 text-left">
                  Type
                </th>

                <th className="p-4 text-left">
                  Stage
                </th>

                <th className="p-4 text-left">
                  Created
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center"
                  >
                    Loading...
                  </td>
                </tr>
              ) : cases.length ===
                0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center"
                  >
                    No cases found
                  </td>
                </tr>
              ) : (
                cases.map(
                  (item) => (
                    <tr
                      key={item.id}
                      className="
                        border-b
                        border-border
                      "
                    >
                      <td className="p-4">
                        <div className="font-medium">
                          {
                            item.title
                          }
                        </div>

                        <div
                          className="
                            text-sm
                            text-muted-foreground
                          "
                        >
                          {item.description ??
                            ''}
                        </div>
                      </td>

                      <td className="p-4">
                        {item.client
                          ?.fullName ??
                          '-'}
                      </td>

                      <td className="p-4">
                        {item.caseType
                          ?.name ??
                          '-'}
                      </td>

                      <td className="p-4">
                        <span
                          className="
                            rounded-lg
                            border
                            border-border
                            px-3
                            py-1
                            text-xs
                          "
                        >
                          {item.stage
                            ?.name ??
                            '-'}
                        </span>
                      </td>

                      <td className="p-4">
                        {new Date(
                          item.createdAt,
                        ).toLocaleDateString()}
                      </td>
                    </tr>
                  ),
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}

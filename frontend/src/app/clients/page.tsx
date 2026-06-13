'use client';

import { useEffect, useState } from 'react';

import { AppShell } from '@/components/layout/app-shell';
import { clientsApi } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';

interface Client {
  id: string;
  fullName: string;
  phone?: string;
  email?: string;
  notes?: string;
  createdAt: string;
  cases?: unknown[];
}

export default function ClientsPage() {
  const [clients, setClients] =
    useState<Client[]>([]);

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
          await clientsApi.getAll(
            token,
          );

        setClients(
          data as Client[],
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
              Clients
            </h1>

            <p className="text-muted-foreground">
              Client management
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
            New Client
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
                  Name
                </th>

                <th className="p-4 text-left">
                  Email
                </th>

                <th className="p-4 text-left">
                  Phone
                </th>

                <th className="p-4 text-left">
                  Cases
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="p-8 text-center"
                  >
                    Loading...
                  </td>
                </tr>
              ) : clients.length ===
                0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="p-8 text-center"
                  >
                    No clients found
                  </td>
                </tr>
              ) : (
                clients.map(
                  (client) => (
                    <tr
                      key={client.id}
                      className="
                        border-b
                        border-border
                      "
                    >
                      <td className="p-4 font-medium">
                        {
                          client.fullName
                        }
                      </td>

                      <td className="p-4">
                        {client.email ??
                          '-'}
                      </td>

                      <td className="p-4">
                        {client.phone ??
                          '-'}
                      </td>

                      <td className="p-4">
                        {client
                          .cases
                          ?.length ??
                          0}
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

'use client';

import { useEffect, useState } from 'react';

import { AppShell } from '@/components/layout/app-shell';
import { clientsApi } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { ClientForm } from '@/components/forms/client-form';

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

  const [showForm, setShowForm] =
    useState(false);

  async function loadClients() {
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

  useEffect(() => {
    loadClients();
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
            onClick={() =>
              setShowForm(true)
            }
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

        {showForm && (
          <div
            className="
              fixed
              inset-0
              z-50
              flex
              items-center
              justify-center
              bg-black/50
            "
            onClick={() =>
              setShowForm(false)
            }
          >
            <div
              className="
                w-full
                max-w-lg
                rounded-2xl
                bg-background
                p-6
                shadow-xl
              "
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              <h2 className="mb-4 text-lg font-semibold">
                New Client
              </h2>

              <ClientForm
                onSuccess={() => {
                  setShowForm(false);
                  loadClients();
                }}
              />
            </div>
          </div>
        )}

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

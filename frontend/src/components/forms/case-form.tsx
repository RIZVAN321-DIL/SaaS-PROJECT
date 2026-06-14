'use client';

import { FormEvent, useEffect, useState } from 'react';

import {
  casesApi,
  clientsApi,
  caseTypesApi,
} from '@/lib/api';

import { getAccessToken } from '@/lib/auth';

interface Client {
  id: string;
  fullName: string;
}

interface CaseType {
  id: string;
  name: string;
}

interface CaseFormProps {
  onSuccess?: () => void;
}

export function CaseForm({
  onSuccess,
}: CaseFormProps) {
  const [loading, setLoading] =
    useState(false);

  const [clients, setClients] =
    useState<Client[]>([]);

  const [caseTypes, setCaseTypes] =
    useState<CaseType[]>([]);

  const [title, setTitle] =
    useState('');

  const [description, setDescription] =
    useState('');

  const [clientId, setClientId] =
    useState('');

  const [caseTypeId, setCaseTypeId] =
    useState('');

  const [error, setError] =
    useState('');

  useEffect(() => {
    async function loadData() {
      const token =
        getAccessToken();

      if (!token) {
        return;
      }

      try {
        const [
          clientsData,
          caseTypesData,
        ] = await Promise.all([
          clientsApi.getAll(
            token,
          ),
          caseTypesApi.getAll(
            token,
          ),
        ]);

        setClients(
          clientsData as Client[],
        );

        setCaseTypes(
          caseTypesData as CaseType[],
        );
      } catch {
        setError(
          'Failed to load data',
        );
      }
    }

    loadData();
  }, []);

  async function handleSubmit(
    e: FormEvent,
  ) {
    e.preventDefault();

    const token =
      getAccessToken();

    if (!token) {
      setError(
        'Authentication required',
      );
      return;
    }

    try {
      setLoading(true);
      setError('');

      await casesApi.create(
        {
          title,
          description:
            description.trim() ||
            undefined,
          clientId,
          caseTypeId:
            caseTypeId || undefined,
        },
        token,
      );

      setTitle('');
      setDescription('');
      setClientId('');
      setCaseTypeId('');

      onSuccess?.();
    } catch {
      setError(
        'Failed to create case',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      <div>
        <label className="mb-2 block text-sm font-medium">
          Case Title
        </label>

        <input
          required
          value={title}
          onChange={(e) =>
            setTitle(
              e.target.value,
            )
          }
          className="
            h-12
            w-full
            rounded-xl
            border
            border-border
            bg-background
            px-4
            outline-none
          "
          placeholder="Contract dispute"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          Client
        </label>

        <select
          required
          value={clientId}
          onChange={(e) =>
            setClientId(
              e.target.value,
            )
          }
          className="
            h-12
            w-full
            rounded-xl
            border
            border-border
            bg-background
            px-4
            outline-none
          "
        >
          <option value="">
            Select client
          </option>

          {clients.map(
            (client) => (
              <option
                key={client.id}
                value={client.id}
              >
                {
                  client.fullName
                }
              </option>
            ),
          )}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          Case Type
        </label>

        <select
          value={caseTypeId}
          onChange={(e) =>
            setCaseTypeId(
              e.target.value,
            )
          }
          className="
            h-12
            w-full
            rounded-xl
            border
            border-border
            bg-background
            px-4
            outline-none
          "
        >
          <option value="">
            Select type
          </option>

          {caseTypes.map(
            (type) => (
              <option
                key={type.id}
                value={type.id}
              >
                {type.name}
              </option>
            ),
          )}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          Description
        </label>

        <textarea
          rows={5}
          value={description}
          onChange={(e) =>
            setDescription(
              e.target.value,
            )
          }
          className="
            w-full
            rounded-xl
            border
            border-border
            bg-background
            px-4
            py-3
            outline-none
          "
          placeholder="Case details..."
        />
      </div>

      {error && (
        <div
          className="
            rounded-xl
            border
            border-red-500/30
            p-3
            text-sm
          "
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="
          h-12
          w-full
          rounded-xl
          bg-primary
          font-medium
          text-primary-foreground
          transition
          disabled:opacity-50
        "
      >
        {loading
          ? 'Creating...'
          : 'Create Case'}
      </button>
    </form>
  );
              }

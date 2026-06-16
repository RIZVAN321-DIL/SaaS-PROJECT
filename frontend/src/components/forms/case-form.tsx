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
          'Не удалось загрузить данные',
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
        'Требуется авторизация',
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
        'Не удалось создать дело',
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
          Название дела
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
          placeholder="Спор по договору"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          Клиент
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
            Выберите клиента
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
          Тип дела
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
            Выберите тип
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
          Описание
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
          placeholder="Детали дела..."
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
          ? 'Создание...'
          : 'Создать дело'}
      </button>
    </form>
  );
}

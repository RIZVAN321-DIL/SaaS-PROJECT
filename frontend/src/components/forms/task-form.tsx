'use client';

import { FormEvent, useEffect, useState } from 'react';

import {
  tasksApi,
  casesApi,
  usersApi,
} from '@/lib/api';

import { getAccessToken } from '@/lib/auth';

interface CaseItem {
  id: string;
  title: string;
}

interface UserItem {
  id: string;
  email: string;
}

interface TaskFormProps {
  onSuccess?: () => void;
}

export function TaskForm({
  onSuccess,
}: TaskFormProps) {
  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const [cases, setCases] =
    useState<CaseItem[]>([]);

  const [users, setUsers] =
    useState<UserItem[]>([]);

  const [title, setTitle] =
    useState('');

  const [description, setDescription] =
    useState('');

  const [caseId, setCaseId] =
    useState('');

  const [assignedToId, setAssignedToId] =
    useState('');

  const [dueDate, setDueDate] =
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
          casesData,
          usersData,
        ] = await Promise.all([
          casesApi.getAll(token),
          usersApi.getAll(token),
        ]);

        setCases(
          casesData as CaseItem[],
        );

        setUsers(
          usersData as UserItem[],
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

      await tasksApi.create(
        {
          title,
          description:
            description.trim() ||
            undefined,
          caseId,
          assignedToId:
            assignedToId ||
            undefined,
          dueDate:
            dueDate || undefined,
        },
        token,
      );

      setTitle('');
      setDescription('');
      setCaseId('');
      setAssignedToId('');
      setDueDate('');

      onSuccess?.();
    } catch {
      setError(
        'Failed to create task',
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
          Task Title
        </label>

        <input
          required
          value={title}
          onChange={(e) =>
            setTitle(
              e.target.value,
            )
          }
          placeholder="Prepare court documents"
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
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          Case
        </label>

        <select
          required
          value={caseId}
          onChange={(e) =>
            setCaseId(
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
            Select case
          </option>

          {cases.map(
            (caseItem) => (
              <option
                key={
                  caseItem.id
                }
                value={
                  caseItem.id
                }
              >
                {
                  caseItem.title
                }
              </option>
            ),
          )}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          Assigned To
        </label>

        <select
          value={assignedToId}
          onChange={(e) =>
            setAssignedToId(
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
            Unassigned
          </option>

          {users.map(
            (user) => (
              <option
                key={user.id}
                value={user.id}
              >
                {user.email}
              </option>
            ),
          )}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          Due Date
        </label>

        <input
          type="datetime-local"
          value={dueDate}
          onChange={(e) =>
            setDueDate(
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
        />
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
          placeholder="Task details..."
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
          : 'Create Task'}
      </button>
    </form>
  );
        }

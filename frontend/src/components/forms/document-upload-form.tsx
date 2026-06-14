'use client';

import { FormEvent, useState } from 'react';

import { documentsApi } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';

interface DocumentUploadFormProps {
  caseId?: string;
  onSuccess?: () => void;
}

export function DocumentUploadForm({
  caseId,
  onSuccess,
}: DocumentUploadFormProps) {
  const [file, setFile] =
    useState<File | null>(null);

  const [name, setName] =
    useState('');

  const [type, setType] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  function handleFileChange(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const selected =
      e.target.files?.[0] || null;

    setFile(selected);

    if (selected && !name) {
      setName(selected.name);
    }
  }

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

    if (!file) {
      setError('File is required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const formData =
        new FormData();

      formData.append(
        'file',
        file,
      );

      formData.append(
        'name',
        name,
      );

      if (type) {
        formData.append(
          'type',
          type,
        );
      }

      if (caseId) {
        formData.append(
          'caseId',
          caseId,
        );
      }

      await documentsApi.upload(
        formData,
        token,
      );

      setFile(null);
      setName('');
      setType('');

      onSuccess?.();
    } catch {
      setError(
        'Failed to upload document',
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
          File
        </label>

        <input
          type="file"
          onChange={handleFileChange}
          className="
            w-full
            rounded-xl
            border
            border-border
            bg-background
            p-3
          "
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          Document Name
        </label>

        <input
          value={name}
          onChange={(e) =>
            setName(
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
          placeholder="Contract.pdf"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          Type
        </label>

        <input
          value={type}
          onChange={(e) =>
            setType(
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
          placeholder="Contract / Evidence / Other"
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
          ? 'Uploading...'
          : 'Upload Document'}
      </button>
    </form>
  );
              }

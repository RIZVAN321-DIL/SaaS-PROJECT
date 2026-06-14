'use client';

import { useEffect, useState } from 'react';

import { AppShell } from '@/components/layout/app-shell';
import { documentsApi } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';

interface DocumentItem {
  id: string;
  name: string;
  type?: string;
  fileUrl?: string;
  createdAt: string;

  case?: {
    id: string;
    title: string;
  };
}

export default function DocumentsPage() {
  const [documents, setDocuments] =
    useState<DocumentItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  async function loadDocuments() {
    const token =
      getAccessToken();

    if (!token) {
      return;
    }

    try {
      const data =
        await documentsApi.getAll(
          token,
        );

      setDocuments(
        data as DocumentItem[],
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDocuments();
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
              Documents
            </h1>

            <p className="text-muted-foreground">
              Secure document storage
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
            Upload Document
          </button>
        </div>

        <div className="grid gap-4">
          {loading ? (
            <div
              className="
                rounded-2xl
                border
                border-border
                bg-card
                p-8
                text-center
              "
            >
              Loading...
            </div>
          ) : documents.length ===
            0 ? (
            <div
              className="
                rounded-2xl
                border
                border-border
                bg-card
                p-8
                text-center
              "
            >
              No documents found
            </div>
          ) : (
            documents.map(
              (document) => (
                <div
                  key={
                    document.id
                  }
                  className="
                    flex
                    items-center
                    justify-between
                    rounded-2xl
                    border
                    border-border
                    bg-card
                    p-5
                  "
                >
                  <div>
                    <h3 className="font-semibold">
                      {
                        document.name
                      }
                    </h3>

                    <div
                      className="
                        mt-1
                        text-sm
                        text-muted-foreground
                      "
                    >
                      Case:{' '}
                      {document.case
                        ?.title ??
                        '-'}
                    </div>

                    <div
                      className="
                        mt-1
                        text-xs
                        text-muted-foreground
                      "
                    >
                      {new Date(
                        document.createdAt,
                      ).toLocaleString()}
                    </div>
                  </div>

                  <div
                    className="
                      flex
                      items-center
                      gap-2
                    "
                  >
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
                      {document.type ??
                        'FILE'}
                    </span>

                    {document.fileUrl && (
                      <a
                        href={
                          document.fileUrl
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="
                          rounded-lg
                          border
                          border-border
                          px-3
                          py-2
                          text-sm
                        "
                      >
                        Open
                      </a>
                    )}
                  </div>
                </div>
              ),
            )
          )}
        </div>
      </div>
    </AppShell>
  );
}

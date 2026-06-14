'use client';

import { useEffect, useState } from 'react';

import { AppShell } from '@/components/layout/app-shell';
import { casesApi } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';

interface BoardCase {
  id: string;
  title: string;

  client?: {
    fullName: string;
  };

  caseType?: {
    name: string;
  };
}

interface Stage {
  id: string;
  name: string;
  color?: string;
  cases: BoardCase[];
}

export default function PipelinePage() {
  const [stages, setStages] =
    useState<Stage[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [draggedCaseId, setDraggedCaseId] =
    useState<string | null>(null);

  useEffect(() => {
    async function loadBoard() {
      try {
        const token =
          getAccessToken();

        if (!token) {
          return;
        }

        const data =
          await casesApi.getBoard(
            token,
          );

        setStages(
          data as Stage[],
        );
      } finally {
        setLoading(false);
      }
    }

    loadBoard();
  }, []);

  async function moveCase(
    caseId: string,
    stageId: string,
  ) {
    const token =
      getAccessToken();

    if (!token) {
      return;
    }

    const previous =
      [...stages];

    setStages((current) => {
      const dragged =
        current
          .flatMap(
            (stage) =>
              stage.cases,
          )
          .find(
            (c) =>
              c.id === caseId,
          );

      if (!dragged) {
        return current;
      }

      return current.map(
        (stage) => {
          if (
            stage.id === stageId
          ) {
            return {
              ...stage,
              cases: [
                ...stage.cases,
                dragged,
              ],
            };
          }

          return {
            ...stage,
            cases:
              stage.cases.filter(
                (c) =>
                  c.id !==
                  caseId,
              ),
          };
        },
      );
    });

    try {
      await casesApi.move(
        caseId,
        stageId,
        token,
      );
    } catch {
      setStages(previous);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">
            Pipeline
          </h1>

          <p className="text-muted-foreground">
            Kanban board for case
            workflow management
          </p>
        </div>

        {loading ? (
          <div className="grid gap-6 lg:grid-cols-4">
            {[1, 2, 3, 4].map(
              (item) => (
                <div
                  key={item}
                  className="
                    h-96
                    animate-pulse
                    rounded-2xl
                    border
                    border-border
                  "
                />
              ),
            )}
          </div>
        ) : (
          <div
            className="
              flex
              gap-6
              overflow-x-auto
              pb-4
            "
          >
            {stages.map(
              (stage) => (
                <div
                  key={stage.id}
                  onDragOver={(
                    e,
                  ) =>
                    e.preventDefault()
                  }
                  onDrop={() => {
                    if (
                      draggedCaseId
                    ) {
                      moveCase(
                        draggedCaseId,
                        stage.id,
                      );
                    }

                    setDraggedCaseId(
                      null,
                    );
                  }}
                  className="
                    min-h-[700px]
                    min-w-[320px]
                    rounded-2xl
                    border
                    border-border
                    bg-card
                    p-4
                  "
                >
                  <div
                    className="
                      mb-4
                      flex
                      items-center
                      justify-between
                    "
                  >
                    <h2 className="font-semibold">
                      {stage.name}
                    </h2>

                    <span
                      className="
                        rounded-lg
                        border
                        border-border
                        px-2
                        py-1
                        text-xs
                      "
                    >
                      {
                        stage
                          .cases
                          .length
                      }
                    </span>
                  </div>

                  <div className="space-y-3">
                    {stage.cases.map(
                      (
                        caseItem,
                      ) => (
                        <div
                          key={
                            caseItem.id
                          }
                          draggable
                          onDragStart={() =>
                            setDraggedCaseId(
                              caseItem.id,
                            )
                          }
                          className="
                            cursor-grab
                            rounded-xl
                            border
                            border-border
                            bg-background
                            p-4
                            transition
                            hover:shadow-md
                          "
                        >
                          <h3 className="font-medium">
                            {
                              caseItem.title
                            }
                          </h3>

                          <div
                            className="
                              mt-2
                              text-sm
                              text-muted-foreground
                            "
                          >
                            {caseItem
                              .client
                              ?.fullName ??
                              'No client'}
                          </div>

                          <div
                            className="
                              mt-3
                              text-xs
                              text-muted-foreground
                            "
                          >
                            {caseItem
                              .caseType
                              ?.name ??
                              'General'}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

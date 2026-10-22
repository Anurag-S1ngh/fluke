"use client";

import { cn } from "@fluke/ui/lib/utils";
import type { Route } from "next";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { useAuth } from "@/components/auth-provider";
import {
  EmptyState,
  Field,
  inputClass,
  PageHeader,
  primaryAction,
  secondaryAction,
  SkeletonRows,
  StatusTag,
  textAction,
} from "@/components/ui-bits";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import type { MarketStatus, MarketSummary } from "@/lib/types";
import { useAsync } from "@/lib/use-async";

const statuses: MarketStatus[] = ["DRAFT", "OPEN", "CLOSED"];

function localDateTimeMin() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 16);
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = React.useState<MarketStatus>("DRAFT");
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [resolveChoice, setResolveChoice] = React.useState<Record<string, string>>({});

  const [question, setQuestion] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [closesAt, setClosesAt] = React.useState("");
  const [publish, setPublish] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [createError, setCreateError] = React.useState<string | null>(null);

  const markets = useAsync(`admin:${status}`, () =>
    api<{ markets: MarketSummary[] }>(`/markets?status=${status}`),
  );

  const min = React.useMemo(() => localDateTimeMin(), []);
  const list = markets.data?.markets ?? [];

  const createMarket = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      await api("/markets", {
        method: "POST",
        body: JSON.stringify({
          question,
          description,
          closesAt: new Date(closesAt).toISOString(),
          publish,
        }),
      });
      toast.success(publish ? "Market published." : "Draft created.");
      setQuestion("");
      setDescription("");
      setClosesAt("");
      setPublish(false);
      const nextStatus = publish ? "OPEN" : "DRAFT";
      if (nextStatus === status) {
        await markets.reload();
      } else {
        setStatus(nextStatus);
      }
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Could not create the market.");
    } finally {
      setCreating(false);
    }
  };

  const publishMarket = async (market: MarketSummary) => {
    setBusyId(market.id);
    try {
      await api(`/markets/${market.id}/publish`, { method: "PATCH" });
      toast.success("Market published.");
      await markets.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not publish the market.");
    } finally {
      setBusyId(null);
    }
  };

  const closeMarket = async (market: MarketSummary) => {
    setBusyId(market.id);
    try {
      await api(`/markets/${market.id}/close`, { method: "PATCH" });
      toast.success("Market closed.");
      await markets.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not close the market.");
    } finally {
      setBusyId(null);
    }
  };

  const deleteMarket = async (market: MarketSummary) => {
    if (!window.confirm("Delete this draft? This cannot be undone.")) return;
    setBusyId(market.id);
    try {
      await api(`/markets/${market.id}`, { method: "DELETE" });
      toast.success("Draft deleted.");
      await markets.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete the market.");
    } finally {
      setBusyId(null);
    }
  };

  const resolveMarket = async (market: MarketSummary) => {
    const choice = resolveChoice[market.id];
    if (!choice) return;
    if (!window.confirm(choice === "REFUND" ? "Refund every position?" : `Resolve as ${choice}?`)) {
      return;
    }
    setBusyId(market.id);
    try {
      await api(`/markets/${market.id}/resolve`, {
        method: "PATCH",
        body: JSON.stringify(choice === "REFUND" ? { refund: true } : { outcome: choice }),
      });
      toast.success(choice === "REFUND" ? "Market refunded." : `Resolved ${choice}.`);
      setResolveChoice((current) => ({ ...current, [market.id]: "" }));
      await markets.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not resolve the market.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="h-full overflow-y-auto">
      <PageHeader
        eyebrow="Admin"
        title="The desk."
        description="Write the question, close the book, and file the answer."
        actions={
          <Link href="/markets" className={secondaryAction}>
            Public view
          </Link>
        }
      />

      {authLoading ? (
        <div className="mx-auto max-w-7xl px-6 py-10">
          <SkeletonRows rows={3} />
        </div>
      ) : !user ? (
        <div className="mx-auto max-w-7xl px-6 py-12">
          <EmptyState
            title="Sign in to reach the desk."
            description="This page is reserved for the people who run the market."
          >
            <Link href={`/signin?next=${encodeURIComponent("/admin")}`} className={primaryAction}>
              Sign in
            </Link>
          </EmptyState>
        </div>
      ) : (
        <div className="mx-auto max-w-7xl space-y-12 px-6 py-10">
          <section className="border-2 border-foreground">
            <header className="flex items-baseline justify-between gap-4 border-b-2 border-foreground px-4 py-3">
              <h2 className="font-mono text-[10px] tracking-[0.18em] uppercase">New market</h2>
              <p className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
                Draft or publish
              </p>
            </header>

            <form onSubmit={createMarket} className="grid gap-4 p-4 lg:grid-cols-2">
              <div className="lg:col-span-2">
                <Field label="Question" hint="At least 10 characters">
                  <input
                    type="text"
                    required
                    minLength={10}
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    placeholder="Will the next launch happen before December?"
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="lg:col-span-2">
                <Field label="Description" hint="At least 20 characters">
                  <textarea
                    required
                    minLength={20}
                    rows={4}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="State the resolution source and the exact condition that settles YES."
                    className={cn(inputClass, "h-auto resize-y py-2 leading-relaxed")}
                  />
                </Field>
              </div>

              <Field label="Closes at">
                <input
                  type="datetime-local"
                  required
                  min={min}
                  value={closesAt}
                  onChange={(event) => setClosesAt(event.target.value)}
                  className={inputClass}
                />
              </Field>

              <div className="flex items-end">
                <label className="flex items-center gap-3 font-mono text-[10px] tracking-[0.14em] uppercase">
                  <input
                    type="checkbox"
                    checked={publish}
                    onChange={(event) => setPublish(event.target.checked)}
                    className="size-4 accent-[var(--signal)]"
                  />
                  Publish immediately
                </label>
              </div>

              {createError ? (
                <p className="border-l-2 border-destructive pl-3 font-mono text-[10px] leading-relaxed tracking-[0.08em] text-destructive uppercase lg:col-span-2">
                  {createError}
                </p>
              ) : null}

              <div className="lg:col-span-2">
                <button
                  type="submit"
                  disabled={
                    creating ||
                    question.trim().length < 10 ||
                    description.trim().length < 20 ||
                    !closesAt
                  }
                  className={primaryAction}
                >
                  {creating ? "Creating…" : publish ? "Create and publish" : "Create draft"}
                </button>
              </div>
            </form>
          </section>

          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-1">
                {statuses.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setStatus(option)}
                    aria-pressed={status === option}
                    className={
                      status === option
                        ? "border-2 border-foreground bg-foreground px-3 py-1.5 font-mono text-[11px] tracking-[0.14em] text-background uppercase"
                        : "border-2 border-transparent px-3 py-1.5 font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase transition-colors hover:text-foreground"
                    }
                  >
                    {option}
                  </button>
                ))}
              </div>
              <p className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                {markets.loading
                  ? "Reading"
                  : `${list.length} ${list.length === 1 ? "market" : "markets"}`}
              </p>
            </div>

            {markets.loading ? (
              <SkeletonRows rows={3} />
            ) : markets.error ? (
              <EmptyState title="Could not read the desk." description={markets.error}>
                <button
                  type="button"
                  onClick={() => void markets.reload()}
                  className={secondaryAction}
                >
                  Try again
                </button>
              </EmptyState>
            ) : list.length === 0 ? (
              <EmptyState
                title={`No ${status.toLowerCase()} markets.`}
                description={
                  status === "DRAFT"
                    ? "Write a question above and keep it as a draft until you are ready."
                    : "Nothing is filed under this heading."
                }
              />
            ) : (
              <div className="border-t-2 border-foreground">
                {list.map((market) => (
                  <article
                    key={market.id}
                    className="flex flex-col gap-4 border-b border-border py-5 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <StatusTag status={market.status} />
                        <span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                          Closes {formatDateTime(market.closesAt)}
                        </span>
                      </div>
                      <Link
                        href={`/markets/${market.id}` as Route}
                        className="mt-2 line-clamp-2 font-serif text-2xl leading-tight underline-offset-4 hover:text-signal hover:underline"
                      >
                        {market.question}
                      </Link>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-3">
                      {market.status === "DRAFT" ? (
                        <>
                          <button
                            type="button"
                            disabled={busyId === market.id}
                            onClick={() => void publishMarket(market)}
                            className="border border-foreground px-3 py-1.5 font-mono text-[10px] tracking-[0.14em] uppercase transition-colors hover:bg-foreground hover:text-background disabled:opacity-40"
                          >
                            Publish
                          </button>
                          <button
                            type="button"
                            disabled={busyId === market.id}
                            onClick={() => void deleteMarket(market)}
                            className="px-2 py-1.5 font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase underline underline-offset-4 transition-colors hover:text-destructive disabled:opacity-40"
                          >
                            Delete
                          </button>
                        </>
                      ) : null}

                      {market.status === "OPEN" ? (
                        <button
                          type="button"
                          disabled={busyId === market.id}
                          onClick={() => void closeMarket(market)}
                          className="border border-foreground px-3 py-1.5 font-mono text-[10px] tracking-[0.14em] uppercase transition-colors hover:bg-foreground hover:text-background disabled:opacity-40"
                        >
                          Close book
                        </button>
                      ) : null}

                      {market.status === "OPEN" || market.status === "CLOSED" ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={resolveChoice[market.id] ?? ""}
                            onChange={(event) =>
                              setResolveChoice((current) => ({
                                ...current,
                                [market.id]: event.target.value,
                              }))
                            }
                            className="h-8 border border-border bg-transparent px-2 font-mono text-[10px] tracking-[0.1em] uppercase"
                          >
                            <option value="">Outcome…</option>
                            <option value="YES">YES</option>
                            <option value="NO">NO</option>
                            <option value="REFUND">Refund</option>
                          </select>
                          <button
                            type="button"
                            disabled={busyId === market.id || !resolveChoice[market.id]}
                            onClick={() => void resolveMarket(market)}
                            className={cn(textAction, "disabled:opacity-40")}
                          >
                            Resolve
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

"use client";

import Link from "next/link";
import * as React from "react";

import { useAuth } from "@/components/layout/auth-provider";
import { SiteFooter } from "@/components/layout/footer";
import { primaryAction, secondaryAction } from "@/components/ui/actions";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonRows } from "@/components/ui/skeleton-rows";
import { api } from "@/lib/api";
import type { MarketStatus, MarketSummary } from "@/lib/types";
import { useAsync } from "@/lib/use-async";

import { AdminMarketList } from "./admin-market-list";
import { CreateMarketForm } from "./create-market-form";

function AdminDesk() {
  const [status, setStatus] = React.useState<MarketStatus>("DRAFT");

  const markets = useAsync(`admin:${status}`, () =>
    api<{ markets: MarketSummary[] }>(`/markets?status=${status}`),
  );

  const handleCreated = React.useCallback(
    async (published: boolean) => {
      const nextStatus = published ? "OPEN" : "DRAFT";
      if (nextStatus === status) {
        await markets.reload();
      } else {
        setStatus(nextStatus);
      }
    },
    [markets, status],
  );

  return (
    <div className="mx-auto max-w-7xl space-y-12 px-6 py-10">
      <CreateMarketForm onCreated={handleCreated} />
      <AdminMarketList
        status={status}
        onStatusChange={setStatus}
        markets={markets.data?.markets ?? []}
        loading={markets.loading}
        error={markets.error}
        onReload={async () => {
          await markets.reload();
        }}
      />
    </div>
  );
}

export function AdminView() {
  const { user, loading: authLoading } = useAuth();

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
      ) : user.role !== "ADMIN" ? (
        <div className="mx-auto max-w-7xl px-6 py-12">
          <EmptyState
            title="Not your desk."
            description="This page is reserved for admins. Your portfolio is the place for your own book."
          >
            <Link href="/markets" className={secondaryAction}>
              Back to markets
            </Link>
          </EmptyState>
        </div>
      ) : (
        <AdminDesk />
      )}

      <SiteFooter />
    </main>
  );
}

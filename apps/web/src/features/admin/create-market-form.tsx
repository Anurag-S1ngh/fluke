"use client";

import * as React from "react";
import { toast } from "sonner";

import { cn } from "@fluke/ui/lib/utils";

import { inputClass, primaryAction } from "@/components/ui/actions";
import { Field } from "@/components/ui/field";
import { api } from "@/lib/api";

function localDateTimeMin() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 16);
}

export function CreateMarketForm({
  onCreated,
}: {
  onCreated: (published: boolean) => Promise<void>;
}) {
  const [question, setQuestion] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [closesAt, setClosesAt] = React.useState("");
  const [publish, setPublish] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [createError, setCreateError] = React.useState<string | null>(null);

  const min = React.useMemo(() => localDateTimeMin(), []);

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
      await onCreated(publish);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Could not create the market.");
    } finally {
      setCreating(false);
    }
  };

  return (
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
              creating || question.trim().length < 10 || description.trim().length < 20 || !closesAt
            }
            className={primaryAction}
          >
            {creating ? "Creating…" : publish ? "Create and publish" : "Create draft"}
          </button>
        </div>
      </form>
    </section>
  );
}

"use client";

import { useState } from "react";

import { getActivity } from "@/features/repair/activities";
import type { AnalysisResult, Receipt } from "@/features/repair/contracts";

type ApiEnvelope<T> = Readonly<{
  success: boolean;
  data: T | null;
  error: Readonly<{ code: string; message: string }> | null;
}>;

const activity = getActivity("correlation-causation").public;

export function RepairStudio() {
  const [response, setResponse] = useState(activity.sampleResponse);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [revision, setRevision] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [forceFallback, setForceFallback] = useState(false);

  const analyze = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const result = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityId: activity.id,
          response,
          mode: "demo",
          forceLunaFallback: forceFallback,
        }),
      });
      const envelope = (await result.json()) as ApiEnvelope<AnalysisResult>;
      if (!result.ok || !envelope.success || !envelope.data) {
        throw new Error(envelope.error?.message ?? "Analysis is temporarily unavailable.");
      }
      setAnalysis(envelope.data);
      setReceipt(null);
    } catch (caught) {
      setAnalysis(null);
      setError(caught instanceof Error ? caught.message : "Analysis is temporarily unavailable.");
    } finally {
      setIsLoading(false);
    }
  };

  const createReceipt = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const result = await fetch("/api/revise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityId: activity.id,
          originalResponse: response,
          revisedResponse: revision,
          mode: "demo",
        }),
      });
      const envelope = (await result.json()) as ApiEnvelope<Receipt>;
      if (!result.ok || !envelope.success || !envelope.data) {
        throw new Error(envelope.error?.message ?? "The receipt could not be created yet.");
      }
      setReceipt(envelope.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The receipt could not be created yet.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main>
      <p>{activity.eyebrow}</p>
      <h1>{activity.title}</h1>
      <p>{activity.prompt}</p>

      <section aria-labelledby="rubric-title">
        <h2 id="rubric-title">What your explanation should show</h2>
        <ul>
          {activity.rubric.map((criterion) => (
            <li key={criterion.id}>{criterion.label}</li>
          ))}
        </ul>
      </section>

      <label htmlFor="learner-response">Your explanation</label>
      <textarea
        id="learner-response"
        value={response}
        onChange={(event) => setResponse(event.target.value)}
      />

      <label>
        <input
          type="checkbox"
          checked={forceFallback}
          onChange={(event) => setForceFallback(event.target.checked)}
        />
        Demonstrate Sol fallback
      </label>

      <button type="button" onClick={analyze} disabled={isLoading}>
        {isLoading ? "Locating the hinge…" : "Find the hinge"}
      </button>

      {error ? (
        <div role="alert">
          <p>{error}</p>
          <button type="button" onClick={analyze}>
            Try again
          </button>
        </div>
      ) : null}

      {analysis ? (
        <section aria-labelledby="question-title">
          <p role="status">Repair crew complete</p>
          <h2 id="question-title">One question before you revise</h2>
          <blockquote>{analysis.diagnosis.socraticQuestion}</blockquote>
          <p>{analysis.diagnosis.whyThisQuestion}</p>
          {analysis.trace.probes.length > 0 ? (
            <div aria-label="Repair crew trace">
              {analysis.trace.probes.map((probe) => (
                <p key={probe.role}>
                  {probe.role}: {probe.status === "fallback" ? "Sol takeover" : "Luna complete"}
                </p>
              ))}
              {analysis.trace.degraded ? <p>Fallback disclosed</p> : null}
            </div>
          ) : null}

          <label htmlFor="revision">Revised explanation</label>
          <textarea
            id="revision"
            value={revision}
            onChange={(event) => setRevision(event.target.value)}
          />
          <button type="button" onClick={createReceipt} disabled={isLoading}>
            {isLoading ? "Comparing the revision…" : "Create repair receipt"}
          </button>
        </section>
      ) : null}

      {receipt ? (
        <section aria-labelledby="receipt-title">
          <p>AI-generated challenge, not a grade</p>
          <h2 id="receipt-title">Repair receipt</h2>
          <h3>{receipt.repairedHinge}</h3>
          <p>{receipt.summary}</p>
          <ul>
            {receipt.changes.map((change) => (
              <li key={change.label}>
                <strong>{change.label}</strong>
                <span>{change.after}</span>
              </li>
            ))}
          </ul>
          {receipt.remainingCaveat ? <p>{receipt.remainingCaveat}</p> : null}
        </section>
      ) : null}
    </main>
  );
}

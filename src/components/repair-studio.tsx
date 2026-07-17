"use client";

import { useState } from "react";

import { getActivity } from "@/features/repair/activities";
import type { AnalysisResult } from "@/features/repair/contracts";

type ApiEnvelope<T> = Readonly<{
  success: boolean;
  data: T | null;
  error: Readonly<{ code: string; message: string }> | null;
}>;

const activity = getActivity("correlation-causation").public;

export function RepairStudio() {
  const [response, setResponse] = useState(activity.sampleResponse);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
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
    } catch (caught) {
      setAnalysis(null);
      setError(caught instanceof Error ? caught.message : "Analysis is temporarily unavailable.");
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
        </section>
      ) : null}
    </main>
  );
}

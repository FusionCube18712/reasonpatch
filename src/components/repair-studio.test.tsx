import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { RepairStudio } from "./repair-studio";

const analysisPayload = {
  success: true,
  data: {
    runId: "run_demo",
    activity: {
      id: "correlation-causation",
      title: "Causation or coincidence?",
    },
    diagnosis: {
      hingeQuote: "The tutoring program caused the improvement",
      misconception: "association-as-causation",
      explanation: "A difference alone cannot isolate a cause.",
      socraticQuestion: "What if more motivated students chose tutoring?",
      whyThisQuestion: "It tests a selection effect.",
      rubric: [],
      limitation: "AI-generated challenge, not a grade.",
    },
    probes: [],
    trace: {
      plannerModel: "demo-fixture",
      synthesisModel: "demo-fixture",
      degraded: true,
      probes: [
        {
          role: "counterexample",
          model: "gpt-5.6-sol",
          status: "fallback",
          latencyMs: 18,
          fallbackReason: "forced",
        },
      ],
    },
  },
  error: null,
};

const receiptPayload = {
  success: true,
  data: {
    activityId: "correlation-causation",
    repairedHinge: "Association is not causation",
    summary: "The revision now qualifies the causal claim.",
    changes: [
      {
        label: "Evidence standard",
        before: null,
        after: "A controlled comparison is needed.",
      },
    ],
    rubric: [
      {
        id: "association-causation",
        label: "Distinguishes association from causation",
        before: "missing",
        after: "met",
        evidence: "does not establish causation",
      },
    ],
    remainingCaveat: null,
    provenance: { model: "gpt-5.6-sol", mode: "demo" },
  },
  error: null,
};

const jsonResponse = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });

describe("RepairStudio", () => {
  it("starts with the rubric visible and the sample ready", () => {
    render(<RepairStudio />);

    expect(
      screen.getByRole("heading", { name: "Causation or coincidence?" }),
    ).toBeVisible();
    expect(screen.getByText("Distinguishes association from causation")).toBeVisible();
    expect(screen.getByLabelText("Your explanation")).toHaveValue(
      "The tutoring program caused the improvement because participants scored eight points higher. Therefore every school should use it.",
    );
  });

  it("announces progress and reveals the repair question", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            runId: "run_demo",
            diagnosis: {
              hingeQuote: "The tutoring program caused the improvement",
              misconception: "association-as-causation",
              explanation: "A difference alone cannot isolate a cause.",
              socraticQuestion: "What if more motivated students chose tutoring?",
              whyThisQuestion: "It tests a selection effect.",
              rubric: [],
              limitation: "AI-generated challenge, not a grade.",
            },
            probes: [],
            trace: { degraded: false, probes: [] },
          },
          error: null,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    render(<RepairStudio />);

    await user.click(screen.getByRole("button", { name: "Find the hinge" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Repair crew complete");
    expect(
      screen.getByRole("heading", { name: "One question before you revise" }),
    ).toBeVisible();
    expect(screen.getByText("What if more motivated students chose tutoring?")).toBeVisible();
  });

  it("shows a plain-language recovery state when analysis fails", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: false,
          data: null,
          error: { code: "UNAVAILABLE", message: "Analysis is temporarily unavailable." },
        }),
        { status: 503, headers: { "Content-Type": "application/json" } },
      ),
    );
    render(<RepairStudio />);

    await user.click(screen.getByRole("button", { name: "Find the hinge" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Analysis is temporarily unavailable.",
    );
    expect(screen.getByRole("button", { name: "Try again" })).toBeVisible();
  });

  it("switches labs and resets the learner workspace", async () => {
    const user = userEvent.setup();
    render(<RepairStudio liveModeAvailable />);

    await user.click(screen.getByRole("button", { name: "Live GPT-5.6" }));
    await user.clear(screen.getByLabelText("Your explanation"));
    await user.type(screen.getByLabelText("Your explanation"), "Temporary draft");
    await user.click(
      screen.getByRole("button", { name: /Accurate test, wrong conclusion/ }),
    );

    expect(
      screen.getByRole("heading", { name: "Accurate test, wrong conclusion" }),
    ).toBeVisible();
    expect(screen.getByLabelText("Your explanation")).toHaveValue(
      "The test is 99% accurate, so a person who tests positive has a 99% chance of having the condition.",
    );
  });

  it("sends explicitly consented live requests without client-forced fallback", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse(analysisPayload));
    render(<RepairStudio liveModeAvailable />);

    await user.click(screen.getByRole("button", { name: "Live GPT-5.6" }));
    await user.click(
      screen.getByRole("checkbox", { name: /I removed names and sensitive details/ }),
    );
    await user.click(screen.getByRole("button", { name: "Find the hinge" }));
    await screen.findByRole("status");

    const request = fetchMock.mock.calls[0];
    expect(request?.[0]).toBe("/api/analyze");
    expect(JSON.parse(String(request?.[1]?.body))).toMatchObject({
      mode: "live",
      forceLunaFallback: false,
    });
    expect(
      screen.queryByRole("checkbox", { name: "Demonstrate Sol fallback" }),
    ).not.toBeInTheDocument();
  });

  it("labels demo orchestration as a recorded fixture trace", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(jsonResponse(analysisPayload));
    render(<RepairStudio />);

    await user.click(screen.getByRole("checkbox", { name: "Demonstrate Sol fallback" }));
    await user.click(screen.getByRole("button", { name: "Find the hinge" }));

    expect(await screen.findByText("Recorded Sol fallback")).toBeVisible();
    expect(screen.getByText("Guided fixture replay · no model calls")).toBeVisible();
    expect(screen.queryByText("18 ms · gpt-5.6-sol")).not.toBeInTheDocument();
  });

  it("uses a safe fallback message for non-Error network failures", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce("offline");
    render(<RepairStudio />);

    await user.click(screen.getByRole("button", { name: "Find the hinge" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Analysis is temporarily unavailable.",
    );
  });

  it("invalidates downstream evidence when an upstream response changes", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(jsonResponse(analysisPayload));
    render(<RepairStudio liveModeAvailable />);

    await user.click(screen.getByRole("button", { name: "Live GPT-5.6" }));
    await user.click(
      screen.getByRole("checkbox", { name: /I removed names and sensitive details/ }),
    );
    await user.click(screen.getByRole("button", { name: "Find the hinge" }));
    expect(await screen.findByRole("status")).toBeVisible();

    await user.type(screen.getByLabelText("Your explanation"), " More context.");

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "One question before you revise" }),
    ).not.toBeInTheDocument();
  });

  it("keeps the curated analysis sample read-only in guided demo mode", () => {
    render(<RepairStudio />);

    expect(screen.getByLabelText("Your explanation")).toHaveAttribute("readonly");
    expect(screen.queryByRole("button", { name: "Live GPT-5.6" })).not.toBeInTheDocument();
  });

  it("turns the learner's revision into an auditable repair receipt", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, "fetch");
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            runId: "run_demo",
            diagnosis: {
              hingeQuote: "The tutoring program caused the improvement",
              misconception: "association-as-causation",
              explanation: "A difference alone cannot isolate a cause.",
              socraticQuestion: "What if more motivated students chose tutoring?",
              whyThisQuestion: "It tests a selection effect.",
              rubric: [],
              limitation: "AI-generated challenge, not a grade.",
            },
            probes: [],
            trace: { degraded: false, probes: [] },
          },
          error: null,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            activityId: "correlation-causation",
            repairedHinge: "Association is not causation",
            summary: "The revision now qualifies the causal claim.",
            changes: [
              {
                label: "Causal claim",
                before: "The program caused the improvement.",
                after: "The difference alone does not establish causation.",
              },
            ],
            rubric: [
              {
                id: "association-causation",
                label: "Distinguishes association from causation",
                before: "missing",
                after: "met",
                evidence: "does not establish causation",
              },
            ],
            remainingCaveat: "A stronger study design is still needed.",
            provenance: { model: "gpt-5.6-sol", mode: "demo" },
          },
          error: null,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    render(<RepairStudio />);

    await user.click(screen.getByRole("button", { name: "Find the hinge" }));
    await user.type(
      screen.getByLabelText("Revised explanation"),
      "Participants scored higher, but self-selection means the difference alone does not establish causation. We need comparable baselines and random assignment.",
    );
    await user.click(screen.getByRole("button", { name: "Create repair receipt" }));

    expect(await screen.findByRole("heading", { name: "Repair receipt" })).toBeVisible();
    expect(screen.getByText("Association is not causation")).toBeVisible();
    expect(screen.getByText("AI-generated challenge, not a grade")).toBeVisible();
  });

  it("retries a failed receipt without losing the learner revision", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, "fetch");
    fetchMock.mockResolvedValueOnce(jsonResponse(analysisPayload));
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        {
          success: false,
          data: null,
          error: { code: "UNAVAILABLE", message: "Receipt service is warming up." },
        },
        503,
      ),
    );
    fetchMock.mockResolvedValueOnce(jsonResponse(receiptPayload));
    render(<RepairStudio />);

    await user.click(screen.getByRole("button", { name: "Find the hinge" }));
    const revision =
      "The observed difference does not establish causation because students self-selected; a controlled comparison would be stronger.";
    await user.type(screen.getByLabelText("Revised explanation"), revision);
    await user.click(screen.getByRole("button", { name: "Create repair receipt" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Receipt service is warming up.",
    );

    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByRole("heading", { name: "Repair receipt" })).toBeVisible();
    expect(screen.getByLabelText("Revised explanation")).toHaveValue(revision);
    expect(screen.queryByText(/A stronger study design/)).not.toBeInTheDocument();
  });

  it("prints a completed receipt on request", async () => {
    const user = userEvent.setup();
    const print = vi.spyOn(window, "print").mockImplementation(() => undefined);
    const fetchMock = vi.spyOn(globalThis, "fetch");
    fetchMock.mockResolvedValueOnce(jsonResponse(analysisPayload));
    fetchMock.mockResolvedValueOnce(jsonResponse(receiptPayload));
    render(<RepairStudio />);

    await user.click(screen.getByRole("button", { name: "Find the hinge" }));
    await user.type(
      screen.getByLabelText("Revised explanation"),
      "The observed difference does not establish causation because students self-selected; a controlled comparison would be stronger.",
    );
    await user.click(screen.getByRole("button", { name: "Create repair receipt" }));
    await user.click(await screen.findByRole("button", { name: "Print receipt" }));

    expect(print).toHaveBeenCalledOnce();
  });

  it("renders missing rubric evidence without a green check or fabricated quote", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, "fetch");
    fetchMock.mockResolvedValueOnce(jsonResponse(analysisPayload));
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        ...receiptPayload,
        data: {
          ...receiptPayload.data,
          rubric: [
            {
              ...receiptPayload.data.rubric[0],
              after: "missing",
              evidence: null,
            },
          ],
        },
      }),
    );
    render(<RepairStudio />);

    await user.click(screen.getByRole("button", { name: "Find the hinge" }));
    await user.type(
      screen.getByLabelText("Revised explanation"),
      "This submitted revision is long enough but still lacks the relevant statistical evidence needed for the rubric.",
    );
    await user.click(screen.getByRole("button", { name: "Create repair receipt" }));

    expect(await screen.findByText("No direct evidence yet.")).toBeVisible();
    expect(screen.getByLabelText("Rubric state: missing")).not.toHaveClass(
      "bg-[#e5eee7]",
    );
  });

  it("requires renewed live consent before sending a revision", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(jsonResponse(analysisPayload));
    render(<RepairStudio liveModeAvailable />);

    await user.click(screen.getByRole("button", { name: "Live GPT-5.6" }));
    const consent = screen.getByRole("checkbox", {
      name: /I removed names and sensitive details/,
    });
    await user.click(consent);
    await user.click(screen.getByRole("button", { name: "Find the hinge" }));
    await user.type(
      screen.getByLabelText("Revised explanation"),
      "The difference alone does not establish causation because students self-selected into the tutoring group.",
    );
    await user.click(consent);

    expect(screen.getByRole("button", { name: "Create repair receipt" })).toBeDisabled();
  });
});

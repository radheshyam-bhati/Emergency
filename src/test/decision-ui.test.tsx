import { render, screen } from "@testing-library/react";
import DecisionReplayPanel from "@/components/DecisionReplayPanel";
import FallbackStrategyBanner from "@/components/FallbackStrategyBanner";
import type { RankingSnapshot } from "@/types/domain";

const sampleDecision: RankingSnapshot = {
  evaluatedAt: "2026-04-03T10:00:00.000Z",
  emergencySeverity: "critical",
  chosenHospitalId: 4,
  queueReason: null,
  score: 82,
  factors: {
    distanceScore: 30,
    pickupEtaMinutes: 4,
    transportEtaMinutes: 9,
    totalEtaMinutes: 13,
    icuScore: 25,
    erScore: 12,
    doctorScore: 11,
    specializationScore: 18,
    severityBoost: 16,
    penalties: 4,
  },
  rejectedOptions: [
    {
      id: 2,
      kind: "hospital",
      name: "Safdarjung Hospital",
      reason: "No ICU beds",
    },
    {
      id: 5,
      kind: "ambulance",
      name: "DL-01-CD-5678",
      reason: "Not ALS for critical case",
    },
  ],
  fallbackStrategy: "nearest-available",
  ranking: [
    {
      hospitalId: 4,
      name: "Fortis Escorts",
      totalScore: 82,
      distanceKm: 7.2,
      etaMinutes: 13,
      recommended: true,
      breakdown: {
        distance: 30,
        icu: 25,
        er: 12,
        doctors: 11,
        specialization: 18,
        severityWeight: 16,
      },
      penalties: [],
    },
  ],
  replay: [
    {
      code: "emergency_created",
      title: "Emergency created",
      detail: "A critical case was registered.",
      timestamp: "2026-04-03T10:00:00.000Z",
      status: "success",
    },
    {
      code: "ambulances_screened",
      title: "Ambulances screened",
      detail: "1 eligible ambulance remained after policy checks.",
      timestamp: "2026-04-03T10:00:02.000Z",
      status: "success",
    },
    {
      code: "dispatch_selected",
      title: "Dispatch selected",
      detail: "Fortis Escorts was chosen with a score of 82.",
      timestamp: "2026-04-03T10:00:04.000Z",
      status: "success",
    },
  ],
};

describe("DecisionReplayPanel", () => {
  it("renders explainability details for the selected dispatch", () => {
    render(<DecisionReplayPanel decision={sampleDecision} />);

    expect(screen.getByText("System Flow / Decision Replay")).toBeInTheDocument();
    expect(screen.getByText("Selected Decision Factors")).toBeInTheDocument();
    expect(screen.getByText("Rejected Options")).toBeInTheDocument();
    expect(screen.getByText(/Safdarjung Hospital/i)).toBeInTheDocument();
    expect(screen.getByText(/Fortis Escorts was chosen with a score of 82/i)).toBeInTheDocument();
  });

  it("renders the compact six-step system story", () => {
    render(<DecisionReplayPanel decision={sampleDecision} compact />);

    expect(screen.getByText("Emergency Created")).toBeInTheDocument();
    expect(screen.getByText("Ambulances Screened")).toBeInTheDocument();
    expect(screen.getByText("Dispatch Decision")).toBeInTheDocument();
  });
});

describe("FallbackStrategyBanner", () => {
  it("renders the waitlist fallback message", () => {
    render(
      <FallbackStrategyBanner
        fallbackStrategy="waitlist"
        queueReason="NO_AMBULANCE"
        retryCount={2}
      />,
    );

    expect(screen.getByText(/Rechecking every 5 seconds/i)).toBeInTheDocument();
  });
});

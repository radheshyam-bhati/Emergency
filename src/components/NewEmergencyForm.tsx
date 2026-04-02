import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Ambulance as AmbulanceIcon,
  Brain,
  CheckCircle2,
  Heart,
  Loader2,
  MapPin,
  Plus,
  Route,
  User,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { type DispatchResult, useSimulation } from "@/hooks/useSimulation";

const CONDITIONS = [
  "Cardiac Arrest", "Stroke", "Road Accident", "Severe Burns",
  "Respiratory Distress", "Head Trauma", "Orthopedic Injury",
  "Chest Pain", "Kidney Failure", "General Emergency",
];

const SEVERITIES = [
  { value: "critical", label: "Critical", color: "bg-emergency text-emergency-foreground" },
  { value: "serious", label: "Serious", color: "bg-critical text-critical-foreground" },
  { value: "moderate", label: "Moderate", color: "bg-warning text-warning-foreground" },
  { value: "minor", label: "Minor", color: "bg-info text-info-foreground" },
];

const DEFAULT_COORDINATES = {
  latitude: "28.6315",
  longitude: "77.2167",
};

type FormStep = "dispatching" | "form" | "results";

function NewEmergencyForm() {
  const { dispatchEmergency } = useSimulation();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<FormStep>("form");
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [condition, setCondition] = useState("");
  const [severity, setSeverity] = useState("critical");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState(DEFAULT_COORDINATES.latitude);
  const [longitude, setLongitude] = useState(DEFAULT_COORDINATES.longitude);
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<DispatchResult | null>(null);

  const reset = () => {
    setStep("form");
    setPatientName("");
    setPatientPhone("");
    setCondition("");
    setSeverity("critical");
    setAddress("");
    setLatitude(DEFAULT_COORDINATES.latitude);
    setLongitude(DEFAULT_COORDINATES.longitude);
    setNotes("");
    setResult(null);
  };

  const handleFullDispatch = async () => {
    if (!condition) {
      toast.error("Select a condition");
      return;
    }

    if (!latitude || !longitude) {
      toast.error("Location is required");
      return;
    }

    setStep("dispatching");

    try {
      const response = await dispatchEmergency({
        condition_type: condition,
        severity: severity as "critical" | "minor" | "moderate" | "serious",
        pickup_latitude: parseFloat(latitude),
        pickup_longitude: parseFloat(longitude),
        pickup_address: address || undefined,
        patient_name: patientName || undefined,
        patient_phone: patientPhone || undefined,
      });

      if (response.success) {
        setResult(response);
        setStep("results");
        toast.success(`Emergency dispatched to ${response.recommended_hospital}`, {
          description: `ETA ~${response.eta_minutes} min${response.ambulance ? ` · ${response.ambulance.vehicle_number} en route` : ""}`,
        });
        return;
      }

      toast.error(response.error || "Dispatch failed");
      setStep("form");
    } catch {
      toast.error("Failed to dispatch emergency");
      setStep("form");
    }
  };

  return (
    <>
      <Button
        onClick={() => {
          setOpen(true);
          reset();
        }}
        className="bg-emergency text-emergency-foreground hover:bg-emergency/90 gap-2"
      >
        <Plus className="h-4 w-4" />
        New Emergency
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/80 p-4 pt-12 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emergency glow-emergency">
                    <AlertTriangle className="h-4 w-4 text-emergency-foreground" />
                  </div>
                  <div>
                    <h2 className="font-bold">
                      {step === "form" && "New Emergency"}
                      {step === "dispatching" && "Dispatching Emergency..."}
                      {step === "results" && "Dispatch Complete"}
                    </h2>
                    <p className="text-[11px] text-muted-foreground">
                      {step === "form" && "Local auto-dispatch scores hospitals, assigns an ambulance, and reserves a bed"}
                      {step === "dispatching" && "Running the local dispatch workflow..."}
                      {step === "results" && `Completed in ${result?.total_time_ms}ms`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {step === "form" && (
                <div className="space-y-5 p-6">
                  <div>
                    <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <User className="h-3 w-3" /> Patient Information
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input
                        placeholder="Patient name"
                        value={patientName}
                        onChange={(event) => setPatientName(event.target.value)}
                      />
                      <Input
                        placeholder="Phone number"
                        value={patientPhone}
                        onChange={(event) => setPatientPhone(event.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <Heart className="h-3 w-3" /> Condition
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {CONDITIONS.map((item) => (
                        <button
                          key={item}
                          onClick={() => setCondition(item)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                            condition === item
                              ? "bg-emergency text-emergency-foreground ring-1 ring-emergency/50"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Severity
                    </h3>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {SEVERITIES.map((item) => (
                        <button
                          key={item.value}
                          onClick={() => setSeverity(item.value)}
                          className={`rounded-lg border py-2 text-xs font-semibold transition-all ${
                            severity === item.value
                              ? `${item.color} border-transparent`
                              : "border-border bg-muted/30 text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <MapPin className="h-3 w-3" /> Pickup Location
                    </h3>
                    <Input
                      placeholder="Address"
                      value={address}
                      onChange={(event) => setAddress(event.target.value)}
                      className="mb-2"
                    />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input
                        placeholder="Latitude"
                        value={latitude}
                        onChange={(event) => setLatitude(event.target.value)}
                        type="number"
                        step="any"
                      />
                      <Input
                        placeholder="Longitude"
                        value={longitude}
                        onChange={(event) => setLongitude(event.target.value)}
                        type="number"
                        step="any"
                      />
                    </div>
                  </div>

                  <Textarea
                    placeholder="Additional notes (optional)"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    rows={2}
                  />

                  <Button
                    onClick={handleFullDispatch}
                    className="w-full gap-2 bg-emergency text-emergency-foreground hover:bg-emergency/90"
                  >
                    <Zap className="h-4 w-4" />
                    Auto-Dispatch Emergency
                  </Button>
                </div>
              )}

              {step === "dispatching" && (
                <div className="flex flex-col items-center justify-center gap-4 py-16">
                  <div className="relative">
                    <div className="h-16 w-16 rounded-full border-2 border-emergency/20" />
                    <Loader2 className="absolute inset-0 m-auto h-8 w-8 animate-spin text-emergency" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold">Full Dispatch Pipeline Running</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Creating emergency → Finding an ambulance → Scoring hospitals → Reserving bed...
                    </p>
                  </div>
                </div>
              )}

              {step === "results" && result && (
                <div className="max-h-[70vh] space-y-4 overflow-y-auto p-6">
                  <div className="rounded-xl border border-border bg-muted/20 p-4">
                    <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold">
                      <Route className="h-3 w-3 text-info" />
                      Dispatch Pipeline ({result.total_time_ms}ms)
                    </h3>
                    <div className="space-y-2">
                      {result.steps.map((dispatchStep, index) => (
                        <div key={index} className="flex items-center gap-3 text-[11px]">
                          <div
                            className={`flex h-5 w-5 items-center justify-center rounded-full ${
                              dispatchStep.status === "success"
                                ? "bg-stable/20 text-stable"
                                : dispatchStep.status === "warning"
                                  ? "bg-warning/20 text-warning"
                                  : dispatchStep.status === "fallback"
                                    ? "bg-critical/20 text-critical"
                                    : "bg-emergency/20 text-emergency"
                            }`}
                          >
                            {dispatchStep.status === "success" ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : dispatchStep.status === "failed" ? (
                              <X className="h-3 w-3" />
                            ) : (
                              <AlertTriangle className="h-3 w-3" />
                            )}
                          </div>
                          <div className="flex-1">
                            <span className="font-medium capitalize">
                              {dispatchStep.step.replace(/_/g, " ")}
                            </span>
                            <span className="ml-2 text-muted-foreground">{dispatchStep.detail}</span>
                          </div>
                          {dispatchStep.duration_ms && (
                            <span className="font-mono text-muted-foreground">
                              {dispatchStep.duration_ms}ms
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {result.ambulance && (
                    <div className="rounded-xl border border-stable/30 bg-stable/5 p-4">
                      <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold">
                        <AmbulanceIcon className="h-3.5 w-3.5 text-stable" />
                        Ambulance Dispatched
                      </h3>
                      <div className="grid grid-cols-3 gap-3 text-[11px]">
                        <div>
                          <div className="text-muted-foreground">Vehicle</div>
                          <div className="font-mono font-medium">{result.ambulance.vehicle_number}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Type</div>
                          <div className="font-medium">{result.ambulance.type}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Distance</div>
                          <div className="font-mono font-medium">
                            {result.ambulance.distance_km.toFixed(1)} km
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold">
                      <Brain className="h-3.5 w-3.5 text-info" />
                      Hospital Rankings
                    </h3>
                    <div className="space-y-2">
                      {result.all_recommendations.map((hospital, index) => (
                        <motion.div
                          key={hospital.hospital_id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.06 }}
                          className={`rounded-xl border p-3 ${
                            index === 0
                              ? "border-stable/40 ring-1 ring-stable/20 bg-stable/5"
                              : "border-border bg-card"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-mono text-sm font-bold ${
                                  index === 0
                                    ? "bg-stable/20 text-stable"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                #{index + 1}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-semibold">{hospital.hospital_name}</h4>
                                  {index === 0 && (
                                    <span className="rounded-md bg-stable/10 px-2 py-0.5 text-[9px] font-bold uppercase text-stable">
                                      Fastest
                                    </span>
                                  )}
                                </div>
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {hospital.reasons.map((reason, reasonIndex) => (
                                    <span
                                      key={reasonIndex}
                                      className="rounded bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
                                    >
                                      {reason}
                                    </span>
                                  ))}
                                </div>
                                <div className="mt-1.5 flex gap-3 text-[10px]">
                                  <span className="text-muted-foreground">
                                    Travel: <span className="font-mono text-foreground">{hospital.breakdown.travel_time}</span>
                                  </span>
                                  <span className="text-muted-foreground">
                                    ICU: <span className="font-mono text-foreground">{hospital.breakdown.icu_availability}</span>
                                  </span>
                                  <span className="text-muted-foreground">
                                    Doctor: <span className="font-mono text-foreground">{hospital.breakdown.doctor_match}</span>
                                  </span>
                                  <span className="text-muted-foreground">
                                    Spec: <span className="font-mono text-foreground">{hospital.breakdown.specialization}</span>
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="ml-3 shrink-0 text-right">
                              <div
                                className={`font-mono text-lg font-bold ${
                                  hospital.score > 40
                                    ? "text-stable"
                                    : hospital.score > 25
                                      ? "text-warning"
                                      : "text-emergency"
                                }`}
                              >
                                {hospital.score}
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                {hospital.eta_minutes}m · {hospital.distance_km}km
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => {
                      reset();
                      setOpen(false);
                    }}
                    className="w-full text-xs"
                  >
                    Close
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default NewEmergencyForm;

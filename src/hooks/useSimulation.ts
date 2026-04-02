import {
  createElement,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  type ActivityEvent,
  type Ambulance,
  type Emergency,
  type Hospital,
  mockActivity,
  mockAmbulances,
  mockEmergencies,
  mockHospitals,
} from "@/data/mockData";

const randomNames = [
  "Ananya Gupta",
  "Rohan Mehta",
  "Sanya Kapoor",
  "Arjun Patel",
  "Neha Reddy",
  "Karan Joshi",
  "Meera Nair",
  "Rahul Saxena",
  "Pooja Bhatt",
  "Deepak Yadav",
];

const conditions = [
  { condition: "Cardiac Arrest", severity: "critical" as const },
  { condition: "Stroke", severity: "critical" as const },
  { condition: "Severe Head Trauma", severity: "critical" as const },
  { condition: "Road Accident — Multiple Fractures", severity: "serious" as const },
  { condition: "Fall Injury — Spinal", severity: "serious" as const },
  { condition: "Respiratory Distress", severity: "serious" as const },
  { condition: "Burn Injury", severity: "moderate" as const },
  { condition: "Allergic Reaction", severity: "moderate" as const },
];

const locations = [
  "Connaught Place, Delhi",
  "Karol Bagh, Delhi",
  "Nehru Place, Delhi",
  "Dwarka, Delhi",
  "Rohini, Delhi",
  "Saket, Delhi",
  "Vasant Kunj, Delhi",
  "Janakpuri, Delhi",
  "Laxmi Nagar, Delhi",
  "Pitampura, Delhi",
];

const conditionTags: Record<string, string[]> = {
  "Cardiac Arrest": ["Cardiology", "Cardiac Surgery"],
  Stroke: ["Neurology", "Neurosurgery"],
  "Severe Head Trauma": ["Trauma", "Neurosurgery"],
  "Road Accident": ["Trauma", "Orthopedics", "General Surgery"],
  "Road Accident — Multiple Fractures": ["Trauma", "Orthopedics", "General Surgery"],
  "Fall Injury — Spinal": ["Trauma", "Orthopedics", "Neurosurgery"],
  "Respiratory Distress": ["Pulmonology"],
  "Burn Injury": ["Burns", "General Surgery"],
  "Severe Burns": ["Burns", "General Surgery"],
  "Chest Pain": ["Cardiology"],
  "Kidney Failure": ["Nephrology"],
  "Orthopedic Injury": ["Orthopedics"],
  "General Emergency": ["Trauma", "General Surgery"],
};

const cloneMockData = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const pickRandomItem = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];
const normalizeDistance = (distance: number) => Number(distance.toFixed(1));

export interface SimulationState {
  hospitals: Hospital[];
  ambulances: Ambulance[];
  emergencies: Emergency[];
  activity: ActivityEvent[];
  realtimeConnected: boolean;
}

export interface DispatchRequest {
  condition_type: string;
  severity: Emergency["severity"];
  pickup_latitude: number;
  pickup_longitude: number;
  pickup_address?: string;
  patient_id?: string;
  patient_name?: string;
  patient_phone?: string;
  bed_type?: string;
}

interface Recommendation {
  hospital_id: string;
  hospital_name: string;
  score: number;
  distance_km: number;
  eta_minutes: number;
  icu_available: number;
  er_available: number;
  ventilators_available: number;
  matched_doctors: string[];
  reasons: string[];
  breakdown: {
    doctor_match: number;
    icu_availability: number;
    specialization: number;
    travel_time: number;
  };
}

interface DispatchStep {
  step: string;
  status: string;
  detail?: string;
  duration_ms?: number;
}

export interface DispatchResult {
  success: boolean;
  emergency_id: string;
  recommended_hospital: string;
  hospital_id: string;
  eta_minutes: number;
  distance_km: number;
  ai_score: number;
  ambulance: {
    id: string;
    vehicle_number: string;
    type: string;
    crew: string;
    distance_km: number;
  } | null;
  all_recommendations: Recommendation[];
  steps: DispatchStep[];
  total_time_ms: number;
  error?: string;
}

interface SimulationContextType extends SimulationState {
  dispatchEmergency: (request: DispatchRequest) => Promise<DispatchResult>;
}

const SimulationContext = createContext<SimulationContextType | null>(null);

const calculateDistanceKm = (
  fromLatitude: number,
  fromLongitude: number,
  toLatitude: number,
  toLongitude: number,
) => {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(toLatitude - fromLatitude);
  const longitudeDelta = toRadians(toLongitude - fromLongitude);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(fromLatitude)) *
      Math.cos(toRadians(toLatitude)) *
      Math.sin(longitudeDelta / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const getConditionMatches = (condition: string, hospital: Hospital) => {
  const tags = conditionTags[condition] ?? conditionTags["General Emergency"];
  return hospital.specializations.filter((specialization) => tags.includes(specialization));
};

const createRecommendation = (
  hospital: Hospital,
  severity: Emergency["severity"],
  pickupLatitude: number,
  pickupLongitude: number,
  condition: string,
): Recommendation => {
  const distanceKm = normalizeDistance(
    calculateDistanceKm(pickupLatitude, pickupLongitude, hospital.lat, hospital.lng),
  );
  const etaMinutes = Math.max(4, Math.round(distanceKm * 2.8 + 4));
  const specializationMatches = getConditionMatches(condition, hospital);
  const specialization = specializationMatches.length > 0 ? 30 : 12;
  const icuAvailability =
    severity === "critical"
      ? Math.min(25, hospital.icuBeds.available * 2)
      : Math.min(25, hospital.emergencyBeds.available + hospital.icuBeds.available);
  const doctorMatch = Math.min(20, hospital.doctors.available);
  const travelTime = Math.max(6, 30 - Math.round(distanceKm * 2.2));
  const score = specialization + icuAvailability + doctorMatch + travelTime;

  return {
    hospital_id: hospital.id,
    hospital_name: hospital.name,
    score,
    distance_km: distanceKm,
    eta_minutes: etaMinutes,
    icu_available: hospital.icuBeds.available,
    er_available: hospital.emergencyBeds.available,
    ventilators_available: hospital.ventilators.available,
    matched_doctors:
      specializationMatches.length > 0
        ? specializationMatches.map((specializationLabel) => `${specializationLabel} team`)
        : ["Emergency response team"],
    reasons: [
      `${hospital.emergencyBeds.available} emergency beds open`,
      `${hospital.icuBeds.available} ICU beds available`,
      specializationMatches.length > 0 ? specializationMatches.join(", ") : "General emergency coverage",
    ],
    breakdown: {
      doctor_match: doctorMatch,
      icu_availability: icuAvailability,
      specialization,
      travel_time: travelTime,
    },
  };
};

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [hospitals, setHospitals] = useState<Hospital[]>(() => cloneMockData(mockHospitals));
  const [ambulances, setAmbulances] = useState<Ambulance[]>(() => cloneMockData(mockAmbulances));
  const [emergencies, setEmergencies] = useState<Emergency[]>(() => cloneMockData(mockEmergencies));
  const [activity, setActivity] = useState<ActivityEvent[]>(() => cloneMockData(mockActivity));
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const countersRef = useRef({ emergency: 10, event: 20 });
  const hospitalsRef = useRef(hospitals);
  const ambulancesRef = useRef(ambulances);

  useEffect(() => {
    hospitalsRef.current = hospitals;
  }, [hospitals]);

  useEffect(() => {
    ambulancesRef.current = ambulances;
  }, [ambulances]);

  const createActivityItem = useCallback(
    (type: ActivityEvent["type"], message: string): ActivityEvent => ({
      id: `ev${countersRef.current.event++}`,
      type,
      message,
      timestamp: "Just now",
    }),
    [],
  );

  const addActivity = useCallback(
    (type: ActivityEvent["type"], message: string) => {
      const nextActivity = createActivityItem(type, message);
      setActivity((previousActivity) => [nextActivity, ...previousActivity].slice(0, 20));
    },
    [createActivityItem],
  );

  const dispatchEmergency = useCallback(
    async (request: DispatchRequest): Promise<DispatchResult> => {
      const {
        condition_type: condition,
        severity,
        pickup_latitude: latitude,
        pickup_longitude: longitude,
      } = request;

      if (!condition || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return {
          success: false,
          emergency_id: "",
          recommended_hospital: "",
          hospital_id: "",
          eta_minutes: 0,
          distance_km: 0,
          ai_score: 0,
          ambulance: null,
          all_recommendations: [],
          steps: [],
          total_time_ms: 0,
          error: "Condition and pickup coordinates are required.",
        };
      }

      const startTime = performance.now();
      const availableAmbulances = ambulancesRef.current.filter((ambulance) => ambulance.status === "available");
      const rankedAmbulances = availableAmbulances
        .map((ambulance) => ({
          ambulance,
          distanceKm: normalizeDistance(
            calculateDistanceKm(latitude, longitude, ambulance.lat, ambulance.lng),
          ),
        }))
        .sort((left, right) => left.distanceKm - right.distanceKm);
      const selectedAmbulance = rankedAmbulances[0] ?? null;

      const recommendations = hospitalsRef.current
        .map((hospital) => createRecommendation(hospital, severity, latitude, longitude, condition))
        .sort((left, right) => right.score - left.score);
      const recommendedHospital = recommendations[0];

      if (!recommendedHospital) {
        return {
          success: false,
          emergency_id: "",
          recommended_hospital: "",
          hospital_id: "",
          eta_minutes: 0,
          distance_km: 0,
          ai_score: 0,
          ambulance: null,
          all_recommendations: [],
          steps: [],
          total_time_ms: 0,
          error: "No hospitals are available for dispatch.",
        };
      }

      const emergencyId = `e${countersRef.current.emergency++}`;
      const patientName = request.patient_name?.trim() || pickRandomItem(randomNames);
      const emergencyLocation =
        request.pickup_address?.trim() || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      const steps: DispatchStep[] = [
        {
          step: "receive_emergency",
          status: "success",
          detail: `${severity} ${condition.toLowerCase()} case registered`,
          duration_ms: 80,
        },
        {
          step: "triage_patient",
          status: "success",
          detail: `Patient routed as ${severity} priority`,
          duration_ms: 110,
        },
        {
          step: "dispatch_ambulance",
          status: selectedAmbulance ? "success" : "warning",
          detail: selectedAmbulance
            ? `${selectedAmbulance.ambulance.vehicleNumber} assigned from ${selectedAmbulance.distanceKm} km away`
            : "No free ambulance right now; hospital notified immediately",
          duration_ms: 160,
        },
        {
          step: "rank_hospitals",
          status: "success",
          detail: `${recommendations.length} hospitals scored for capacity and travel time`,
          duration_ms: 220,
        },
        {
          step: "reserve_bed",
          status: "success",
          detail: `Reserved bed at ${recommendedHospital.hospital_name}`,
          duration_ms: 130,
        },
        {
          step: "notify_command_center",
          status: "success",
          detail: "Command center dashboards updated",
          duration_ms: 90,
        },
      ];

      setEmergencies((previousEmergencies) => [
        {
          id: emergencyId,
          patientName,
          condition,
          severity,
          location: emergencyLocation,
          timestamp: "Just now",
          assignedAmbulance: selectedAmbulance?.ambulance.vehicleNumber,
          assignedHospital: recommendedHospital.hospital_name,
          status: "dispatched",
          eta: `${recommendedHospital.eta_minutes} min`,
        },
        ...previousEmergencies,
      ].slice(0, 12));

      if (selectedAmbulance) {
        setAmbulances((previousAmbulances) =>
          previousAmbulances.map((ambulance) =>
            ambulance.id === selectedAmbulance.ambulance.id
              ? {
                  ...ambulance,
                  status: "dispatched",
                  currentEmergency: emergencyId,
                }
              : ambulance,
          ),
        );
      }

      setHospitals((previousHospitals) =>
        previousHospitals.map((hospital) => {
          if (hospital.id !== recommendedHospital.hospital_id) {
            return hospital;
          }

          return {
            ...hospital,
            emergencyBeds: {
              ...hospital.emergencyBeds,
              available: Math.max(0, hospital.emergencyBeds.available - 1),
            },
            icuBeds: {
              ...hospital.icuBeds,
              available:
                severity === "critical"
                  ? Math.max(0, hospital.icuBeds.available - 1)
                  : hospital.icuBeds.available,
            },
            ventilators: {
              ...hospital.ventilators,
              available:
                severity === "critical"
                  ? Math.max(0, hospital.ventilators.available - 1)
                  : hospital.ventilators.available,
            },
          };
        }),
      );

      setActivity((previousActivity) => {
        const nextEvents = [
          createActivityItem("emergency", `New ${severity} emergency: ${condition} at ${emergencyLocation}`),
          createActivityItem(
            "dispatch",
            selectedAmbulance
              ? `Ambulance ${selectedAmbulance.ambulance.vehicleNumber} dispatched for ${patientName}`
              : `Dispatch queue opened for ${patientName}`,
          ),
          createActivityItem(
            "bed-reserved",
            `Bed reserved at ${recommendedHospital.hospital_name} for ${patientName}`,
          ),
        ];

        return [...nextEvents, ...previousActivity].slice(0, 20);
      });

      setRealtimeConnected(true);
      await new Promise((resolve) => window.setTimeout(resolve, 900));

      return {
        success: true,
        emergency_id: emergencyId,
        recommended_hospital: recommendedHospital.hospital_name,
        hospital_id: recommendedHospital.hospital_id,
        eta_minutes: recommendedHospital.eta_minutes,
        distance_km: recommendedHospital.distance_km,
        ai_score: recommendedHospital.score,
        ambulance: selectedAmbulance
          ? {
              id: selectedAmbulance.ambulance.id,
              vehicle_number: selectedAmbulance.ambulance.vehicleNumber,
              type: selectedAmbulance.ambulance.type,
              crew: selectedAmbulance.ambulance.crew,
              distance_km: selectedAmbulance.distanceKm,
            }
          : null,
        all_recommendations: recommendations,
        steps,
        total_time_ms: Math.round(performance.now() - startTime),
      };
    },
    [createActivityItem],
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setRealtimeConnected(true);
    }, 400);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setAmbulances((previousAmbulances) =>
        previousAmbulances.map((ambulance) => ({
          ...ambulance,
          lat: ambulance.lat + (Math.random() - 0.5) * 0.004,
          lng: ambulance.lng + (Math.random() - 0.5) * 0.004,
        })),
      );
    }, 2000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setAmbulances((previousAmbulances) => {
        const index = Math.floor(Math.random() * previousAmbulances.length);
        const statuses: Ambulance["status"][] = ["available", "dispatched", "en-route", "at-hospital"];
        const updatedAmbulances = [...previousAmbulances];
        const nextStatus = pickRandomItem(statuses);
        const currentAmbulance = updatedAmbulances[index];

        updatedAmbulances[index] = { ...currentAmbulance, status: nextStatus };

        if (nextStatus === "dispatched" || nextStatus === "en-route") {
          addActivity("dispatch", `Ambulance ${currentAmbulance.vehicleNumber} status → ${nextStatus}`);
        }

        return updatedAmbulances;
      });
    }, 6000);

    return () => window.clearInterval(interval);
  }, [addActivity]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setHospitals((previousHospitals) =>
        previousHospitals.map((hospital) => {
          const adjustAvailability = (resource: { available: number; total: number }) => {
            const delta = Math.random() < 0.5 ? -1 : 1;

            return {
              ...resource,
              available: Math.max(0, Math.min(resource.total, resource.available + delta)),
            };
          };

          return {
            ...hospital,
            icuBeds: adjustAvailability(hospital.icuBeds),
            emergencyBeds: adjustAvailability(hospital.emergencyBeds),
            ventilators: adjustAvailability(hospital.ventilators),
            doctors: adjustAvailability(hospital.doctors),
          };
        }),
      );
    }, 5000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const spawnEmergency = () => {
      const emergencyId = `e${countersRef.current.emergency++}`;
      const { condition, severity } = pickRandomItem(conditions);
      const patientName = pickRandomItem(randomNames);
      const location = pickRandomItem(locations);
      const emergency: Emergency = {
        id: emergencyId,
        patientName,
        condition,
        severity,
        location,
        timestamp: "Just now",
        status: "new",
      };

      setEmergencies((previousEmergencies) => [emergency, ...previousEmergencies].slice(0, 12));
      addActivity("emergency", `New ${severity} emergency: ${condition} at ${location}`);

      window.setTimeout(() => {
        setAmbulances((previousAmbulances) => {
          const availableAmbulanceIndex = previousAmbulances.findIndex(
            (ambulance) => ambulance.status === "available",
          );

          if (availableAmbulanceIndex === -1) {
            return previousAmbulances;
          }

          const updatedAmbulances = [...previousAmbulances];
          const dispatchedAmbulance = {
            ...updatedAmbulances[availableAmbulanceIndex],
            status: "dispatched" as const,
            currentEmergency: emergencyId,
          };

          updatedAmbulances[availableAmbulanceIndex] = dispatchedAmbulance;
          addActivity("dispatch", `Ambulance ${dispatchedAmbulance.vehicleNumber} dispatched for ${patientName}`);

          const hospital = pickRandomItem(hospitalsRef.current);
          setEmergencies((previousEmergencies) =>
            previousEmergencies.map((currentEmergency) =>
              currentEmergency.id === emergencyId
                ? {
                    ...currentEmergency,
                    status: "dispatched",
                    assignedAmbulance: dispatchedAmbulance.vehicleNumber,
                    assignedHospital: hospital.name,
                    eta: `${Math.floor(5 + Math.random() * 12)} min`,
                  }
                : currentEmergency,
            ),
          );
          addActivity("bed-reserved", `Bed reserved at ${hospital.name} for ${patientName}`);

          return updatedAmbulances;
        });
      }, 3000 + Math.random() * 3000);
    };

    const interval = window.setInterval(spawnEmergency, 10000 + Math.random() * 10000);
    return () => window.clearInterval(interval);
  }, [addActivity]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setEmergencies((previousEmergencies) => {
        const progressableEmergencies = previousEmergencies.filter(
          (emergency) => emergency.status === "dispatched" || emergency.status === "in-transit",
        );

        if (progressableEmergencies.length === 0) {
          return previousEmergencies;
        }

        const targetEmergency = pickRandomItem(progressableEmergencies);
        const nextStatus = targetEmergency.status === "dispatched" ? "in-transit" : "arrived";

        if (nextStatus === "arrived" && targetEmergency.assignedHospital) {
          addActivity("arrival", `Patient ${targetEmergency.patientName} arrived at ${targetEmergency.assignedHospital}`);
        }

        return previousEmergencies.map((emergency) =>
          emergency.id === targetEmergency.id ? { ...emergency, status: nextStatus } : emergency,
        );
      });
    }, 8000);

    return () => window.clearInterval(interval);
  }, [addActivity]);

  return createElement(
    SimulationContext.Provider,
    {
      value: {
        hospitals,
        ambulances,
        emergencies,
        activity,
        realtimeConnected,
        dispatchEmergency,
      },
    },
    children,
  );
}

export function useSimulation() {
  const context = useContext(SimulationContext);

  if (!context) {
    throw new Error("useSimulation must be used within SimulationProvider");
  }

  return context;
}

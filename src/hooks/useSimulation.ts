import { useCallback, useEffect, useRef, useState } from "react";
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
import { type RealtimeEvent, useRealtimeEvents } from "./useRealtimeEvents";

const randomNames = [
  "Ananya Gupta", "Rohan Mehta", "Sanya Kapoor", "Arjun Patel", "Neha Reddy",
  "Karan Joshi", "Meera Nair", "Rahul Saxena", "Pooja Bhatt", "Deepak Yadav",
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
  "Connaught Place, Delhi", "Karol Bagh, Delhi", "Nehru Place, Delhi",
  "Dwarka, Delhi", "Rohini, Delhi", "Saket, Delhi", "Vasant Kunj, Delhi",
  "Janakpuri, Delhi", "Laxmi Nagar, Delhi", "Pitampura, Delhi",
];

const cloneMockData = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const pickRandomItem = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

export interface SimulationState {
  hospitals: Hospital[];
  ambulances: Ambulance[];
  emergencies: Emergency[];
  activity: ActivityEvent[];
  realtimeConnected: boolean;
}

export function useSimulation(): SimulationState {
  const [hospitals, setHospitals] = useState<Hospital[]>(() => cloneMockData(mockHospitals));
  const [ambulances, setAmbulances] = useState<Ambulance[]>(() => cloneMockData(mockAmbulances));
  const [emergencies, setEmergencies] = useState<Emergency[]>(() => cloneMockData(mockEmergencies));
  const [activity, setActivity] = useState<ActivityEvent[]>(() => cloneMockData(mockActivity));
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const countersRef = useRef({ emergency: 10, event: 20 });

  const addActivity = useCallback((type: ActivityEvent["type"], message: string) => {
    const id = `ev${countersRef.current.event++}`;
    setActivity((previousActivity) => [
      { id, type, message, timestamp: "Just now" },
      ...previousActivity,
    ].slice(0, 20));
  }, []);

  const handleRealtimeEvent = useCallback((event: RealtimeEvent) => {
    setRealtimeConnected(true);

    switch (event.type) {
      case "ambulance_location_update":
        setAmbulances((previousAmbulances) =>
          previousAmbulances.map((ambulance) =>
            ambulance.id === event.payload.ambulance_id
              ? { ...ambulance, lat: event.payload.latitude, lng: event.payload.longitude }
              : ambulance,
          ),
        );
        break;

      case "hospital_resource_update":
        setHospitals((previousHospitals) =>
          previousHospitals.map((hospital) => {
            if (hospital.id !== event.payload.hospital_id) {
              return hospital;
            }

            return {
              ...hospital,
              icuBeds: { ...hospital.icuBeds, available: event.payload.icu_beds_available },
              emergencyBeds: {
                ...hospital.emergencyBeds,
                available: event.payload.emergency_beds_available,
              },
              ventilators: {
                ...hospital.ventilators,
                available: event.payload.ventilators_available,
              },
            };
          }),
        );
        addActivity("bed-reserved", `Hospital resources updated (ICU: ${event.payload.icu_beds_available})`);
        break;

      case "new_emergency_alert":
        addActivity("emergency", `New ${event.payload.severity} emergency: ${event.payload.condition_type}`);
        break;

      case "ambulance_assigned":
        addActivity(
          "dispatch",
          `Ambulance ${event.payload.vehicle_number || event.payload.ambulance_id} assigned`,
        );
        break;

      case "hospital_reserved":
        addActivity("bed-reserved", `Hospital bed reserved for emergency ${event.payload.emergency_id}`);
        break;
    }
  }, [addActivity]);

  useRealtimeEvents(handleRealtimeEvent);

  useEffect(() => {
    const interval = setInterval(() => {
      setAmbulances((previousAmbulances) =>
        previousAmbulances.map((ambulance) => ({
          ...ambulance,
          lat: ambulance.lat + (Math.random() - 0.5) * 0.004,
          lng: ambulance.lng + (Math.random() - 0.5) * 0.004,
        })),
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
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

    return () => clearInterval(interval);
  }, [addActivity]);

  useEffect(() => {
    const interval = setInterval(() => {
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

    return () => clearInterval(interval);
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

      setTimeout(() => {
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

          const hospital = pickRandomItem(mockHospitals);
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

    const interval = setInterval(spawnEmergency, 10000 + Math.random() * 10000);
    return () => clearInterval(interval);
  }, [addActivity]);

  useEffect(() => {
    const interval = setInterval(() => {
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

    return () => clearInterval(interval);
  }, [addActivity]);

  return { hospitals, ambulances, emergencies, activity, realtimeConnected };
}

import { useCallback, useEffect, useRef } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AmbulanceRow {
  crew: string | null;
  current_latitude: number;
  current_longitude: number;
  id: string;
  status: string;
  vehicle_number: string;
}

interface HospitalResourceRow {
  emergency_beds_available: number;
  hospital_id: string;
  icu_beds_available: number;
  last_updated: string;
  ventilators_available: number;
}

interface EmergencyRequestRow {
  assigned_ambulance_id: string | null;
  assigned_hospital_id: string | null;
  condition_type: string;
  id: string;
  pickup_address: string | null;
  pickup_latitude: number;
  pickup_longitude: number;
  severity: string;
  status: string;
}

interface RealtimeEventMap {
  ambulance_location_update: {
    ambulance_id: string;
    latitude: number;
    longitude: number;
    status: string;
    vehicle_number: string;
  };
  hospital_resource_update: {
    emergency_beds_available: number;
    hospital_id: string;
    icu_beds_available: number;
    last_updated: string;
    ventilators_available: number;
  };
  new_emergency_alert: {
    condition_type: string;
    emergency_id: string;
    pickup_address: string | null;
    severity: string;
    status: string;
  };
  ambulance_assigned: {
    ambulance_id: string;
    emergency_id?: string;
    status?: string;
    vehicle_number?: string;
  };
  hospital_reserved: {
    condition_type: string;
    emergency_id: string;
    hospital_id: string;
  };
}

type ConnectionStatus = "connecting" | "connected" | "disconnected";
export type RealtimeEventType = keyof RealtimeEventMap;

export type RealtimeEvent = {
  [EventType in RealtimeEventType]: {
    type: EventType;
    payload: RealtimeEventMap[EventType];
    timestamp: Date;
  };
}[RealtimeEventType];

type EventHandler = (event: RealtimeEvent) => void;

export function useRealtimeEvents(onEvent?: EventHandler) {
  const subscribersRef = useRef<Set<EventHandler>>(new Set());
  const connectionStatusRef = useRef<ConnectionStatus>("connecting");

  useEffect(() => {
    if (!onEvent) {
      return;
    }

    const subscribers = subscribersRef.current;
    subscribers.add(onEvent);

    return () => {
      subscribers.delete(onEvent);
    };
  }, [onEvent]);

  const emitEvent = useCallback(
    <EventType extends RealtimeEventType>(type: EventType, payload: RealtimeEventMap[EventType]) => {
      const event = { type, payload, timestamp: new Date() } as RealtimeEvent;

      subscribersRef.current.forEach((subscriber) => {
        try {
          subscriber(event);
        } catch (error) {
          console.error("Realtime handler error:", error);
        }
      });
    },
    [],
  );

  useEffect(() => {
    const ambulanceChannel = supabase
      .channel("realtime-ambulances")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "ambulances" },
        (payload: RealtimePostgresChangesPayload<AmbulanceRow>) => {
          const nextRow = payload.new as AmbulanceRow;
          const previousRow = (payload.old ?? {}) as Partial<AmbulanceRow>;

          if (
            nextRow.current_latitude !== previousRow.current_latitude ||
            nextRow.current_longitude !== previousRow.current_longitude
          ) {
            emitEvent("ambulance_location_update", {
              ambulance_id: nextRow.id,
              latitude: nextRow.current_latitude,
              longitude: nextRow.current_longitude,
              status: nextRow.status,
              vehicle_number: nextRow.vehicle_number,
            });
          }

          if (previousRow.status !== nextRow.status && nextRow.status === "on_route") {
            emitEvent("ambulance_assigned", {
              ambulance_id: nextRow.id,
              status: nextRow.status,
              vehicle_number: nextRow.vehicle_number,
            });
            toast.info(`🚑 ${nextRow.vehicle_number} dispatched`, {
              description: `Crew: ${nextRow.crew || "Unknown"}`,
            });
          }
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          connectionStatusRef.current = "connected";
        }
      });

    const resourceChannel = supabase
      .channel("realtime-hospital-resources")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "hospital_resources" },
        (payload: RealtimePostgresChangesPayload<HospitalResourceRow>) => {
          const nextRow = payload.new as HospitalResourceRow;

          emitEvent("hospital_resource_update", {
            emergency_beds_available: nextRow.emergency_beds_available,
            hospital_id: nextRow.hospital_id,
            icu_beds_available: nextRow.icu_beds_available,
            last_updated: nextRow.last_updated,
            ventilators_available: nextRow.ventilators_available,
          });

          if (nextRow.icu_beds_available === 0) {
            toast.warning("⚠ ICU Full", {
              description: `Hospital ${nextRow.hospital_id} has 0 ICU beds remaining`,
            });
          }
        },
      )
      .subscribe();

    const emergencyChannel = supabase
      .channel("realtime-emergencies")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "emergency_requests" },
        (payload: RealtimePostgresChangesPayload<EmergencyRequestRow>) => {
          const nextRow = payload.new as EmergencyRequestRow;
          const isCritical = nextRow.severity === "critical";
          const showToast = isCritical ? toast.error : toast.info;

          emitEvent("new_emergency_alert", {
            condition_type: nextRow.condition_type,
            emergency_id: nextRow.id,
            pickup_address: nextRow.pickup_address,
            severity: nextRow.severity,
            status: nextRow.status,
          });

          showToast(`${isCritical ? "🔴" : "🟡"} New Emergency: ${nextRow.condition_type}`, {
            description: nextRow.pickup_address || `${nextRow.pickup_latitude}, ${nextRow.pickup_longitude}`,
            duration: isCritical ? 10000 : 5000,
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "emergency_requests" },
        (payload: RealtimePostgresChangesPayload<EmergencyRequestRow>) => {
          const nextRow = payload.new as EmergencyRequestRow;
          const previousRow = (payload.old ?? {}) as Partial<EmergencyRequestRow>;

          if (!previousRow.assigned_hospital_id && nextRow.assigned_hospital_id) {
            emitEvent("hospital_reserved", {
              condition_type: nextRow.condition_type,
              emergency_id: nextRow.id,
              hospital_id: nextRow.assigned_hospital_id,
            });
          }

          if (!previousRow.assigned_ambulance_id && nextRow.assigned_ambulance_id) {
            emitEvent("ambulance_assigned", {
              ambulance_id: nextRow.assigned_ambulance_id,
              emergency_id: nextRow.id,
            });
          }
        },
      )
      .subscribe();

    return () => {
      connectionStatusRef.current = "disconnected";
      supabase.removeChannel(ambulanceChannel);
      supabase.removeChannel(resourceChannel);
      supabase.removeChannel(emergencyChannel);
    };
  }, [emitEvent]);

  return { connectionStatus: connectionStatusRef };
}

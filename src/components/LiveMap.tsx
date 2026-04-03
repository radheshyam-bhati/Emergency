import { useEffect, useRef, useCallback, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Building2, Ambulance as AmbIcon, AlertTriangle, Navigation } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";

// ── Types ──
interface MapHospital {
  id: string | number;
  name: string;
  lat: number;
  lng: number;
  status: string;
}

interface MapAmbulance {
  id: string | number;
  vehicleNumber: string;
  lat: number;
  lng: number;
  status: string;
}

interface MapEmergency {
  id: string | number;
  lat?: number;
  lng?: number;
  severity: string;
}

export interface RouteInfo {
  hospitalId: string | number;
  hospitalName: string;
  distanceKm: number;
  etaMinutes: number;
  isFastest: boolean;
}

interface LiveMapProps {
  hospitals?: MapHospital[];
  ambulances?: MapAmbulance[];
  emergencies?: MapEmergency[];
  className?: string;
  showLegend?: boolean;
  showRouting?: boolean;
  routeOrigin?: { lat: number; lng: number } | null;
  onRoutesCalculated?: (routes: RouteInfo[]) => void;
}

// ── Icon factories ──
const statusColors: Record<string, string> = {
  operational: "hsl(160,70%,45%)",
  "high-load": "hsl(45,95%,55%)",
  critical: "hsl(0,85%,55%)",
  offline: "hsl(215,15%,55%)",
  available: "hsl(160,70%,45%)",
  queued: "hsl(45,95%,55%)",
  assigned: "hsl(45,95%,55%)",
  dispatched: "hsl(45,95%,55%)",
  "en-route": "hsl(0,85%,55%)",
  "at-hospital": "hsl(215,80%,50%)",
  on_route: "hsl(0,85%,55%)",
  busy: "hsl(215,80%,50%)",
};

function makeIcon(html: string, size: [number, number] = [28, 28]) {
  return L.divIcon({ html, className: "leaflet-custom-icon", iconSize: size, iconAnchor: [size[0] / 2, size[1] / 2] });
}

function hospitalIcon(status: string) {
  const color = statusColors[status] || statusColors.operational;
  return makeIcon(
    `<div style="width:28px;height:28px;border-radius:8px;border:2px solid ${color};background:${color}22;display:flex;align-items:center;justify-content:center;">
      ${renderToStaticMarkup(<Building2 style={{ width: 14, height: 14, color: "#e2e8f0" }} />)}
    </div>`,
    [28, 28]
  );
}

function ambulanceIcon(status: string) {
  const isActive = !["available", "at-hospital", "busy"].includes(status);
  const bg = isActive ? "hsl(0,85%,55%)" : "hsl(220,15%,12%)";
  return makeIcon(
    `<div style="width:22px;height:22px;border-radius:50%;background:${bg};display:flex;align-items:center;justify-content:center;${isActive ? "box-shadow:0 0 12px hsl(0,85%,55%,0.5);" : ""}">
      ${renderToStaticMarkup(<AmbIcon style={{ width: 12, height: 12, color: "#e2e8f0" }} />)}
    </div>`,
    [22, 22]
  );
}

function emergencyIcon(severity: string) {
  const color = severity === "critical" ? "hsl(0,85%,55%)" : "hsl(45,95%,55%)";
  return makeIcon(
    `<div style="width:20px;height:20px;display:flex;align-items:center;justify-content:center;position:relative;">
      ${severity === "critical" ? `<div style="position:absolute;width:20px;height:20px;border-radius:50%;background:${color};opacity:0.3;animation:ping 1.5s infinite;"></div>` : ""}
      ${renderToStaticMarkup(<AlertTriangle style={{ width: 16, height: 16, color }} />)}
    </div>`,
    [20, 20]
  );
}

// ── OSRM free routing ──
async function fetchOSRMRoute(
  origin: { lat: number; lng: number },
  dest: { lat: number; lng: number }
): Promise<{ distanceKm: number; etaMinutes: number; geometry: [number, number][] } | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.length) return null;
    const route = data.routes[0];
    return {
      distanceKm: Math.round((route.distance / 1000) * 10) / 10,
      etaMinutes: Math.round(route.duration / 60),
      geometry: route.geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]),
    };
  } catch {
    return null;
  }
}

// ── Dark tile URL ──
const TILE_URL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

// ── Component ──
const LiveMap = ({
  hospitals = [],
  ambulances = [],
  emergencies = [],
  className = "",
  showLegend = true,
  showRouting = false,
  routeOrigin = null,
  onRoutesCalculated,
}: LiveMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hospitalMarkersRef = useRef<Map<string | number, L.Marker>>(new Map());
  const ambulanceMarkersRef = useRef<Map<string | number, L.Marker>>(new Map());
  const emergencyMarkersRef = useRef<Map<string | number, L.Marker>>(new Map());
  const routeLinesRef = useRef<L.Polyline[]>([]);
  const [routes, setRoutes] = useState<RouteInfo[]>([]);

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [28.58, 77.22],
      zoom: 12,
      zoomControl: false,
      attributionControl: false,
    });
    L.tileLayer(TILE_URL, { attribution: TILE_ATTR, maxZoom: 18 }).addTo(map);
    L.control.zoom({ position: "topright" }).addTo(map);
    L.control.attribution({ position: "bottomright" }).addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update hospital markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const existing = hospitalMarkersRef.current;
    const currentIds = new Set(hospitals.map((h) => h.id));

    // Remove stale
    existing.forEach((marker, id) => {
      if (!currentIds.has(id)) { marker.remove(); existing.delete(id); }
    });

    hospitals.forEach((h) => {
      const icon = hospitalIcon(h.status);
      if (existing.has(h.id)) {
        existing.get(h.id)!.setLatLng([h.lat, h.lng]).setIcon(icon);
      } else {
        const m = L.marker([h.lat, h.lng], { icon }).addTo(map);
        m.bindTooltip(h.name, { className: "leaflet-dark-tooltip", direction: "top", offset: [0, -14] });
        existing.set(h.id, m);
      }
    });
  }, [hospitals]);

  // Update ambulance markers with smooth animation
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const existing = ambulanceMarkersRef.current;
    const currentIds = new Set(ambulances.map((a) => a.id));

    existing.forEach((marker, id) => {
      if (!currentIds.has(id)) { marker.remove(); existing.delete(id); }
    });

    ambulances.forEach((a) => {
      const icon = ambulanceIcon(a.status);
      if (existing.has(a.id)) {
        const m = existing.get(a.id)!;
        m.setLatLng([a.lat, a.lng]);
        m.setIcon(icon);
      } else {
        const m = L.marker([a.lat, a.lng], { icon, zIndexOffset: 500 }).addTo(map);
        m.bindTooltip(`${a.vehicleNumber} — ${a.status}`, { className: "leaflet-dark-tooltip", direction: "top", offset: [0, -12] });
        existing.set(a.id, m);
      }
    });
  }, [ambulances]);

  // Update emergency markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const existing = emergencyMarkersRef.current;
    const currentIds = new Set(emergencies.map((e) => e.id));

    existing.forEach((marker, id) => {
      if (!currentIds.has(id)) { marker.remove(); existing.delete(id); }
    });

    emergencies.forEach((e) => {
      if (!e.lat || !e.lng) return;
      const icon = emergencyIcon(e.severity);
      if (existing.has(e.id)) {
        existing.get(e.id)!.setLatLng([e.lat, e.lng]).setIcon(icon);
      } else {
        const m = L.marker([e.lat, e.lng], { icon, zIndexOffset: 1000 }).addTo(map);
        m.bindTooltip(`Emergency — ${e.severity}`, { className: "leaflet-dark-tooltip", direction: "top" });
        existing.set(e.id, m);
      }
    });
  }, [emergencies]);

  // Route calculation
  useEffect(() => {
    if (!showRouting || !routeOrigin || hospitals.length === 0) return;
    const map = mapRef.current;
    if (!map) return;

    // Clear old routes
    routeLinesRef.current.forEach((l) => l.remove());
    routeLinesRef.current = [];

    const calculate = async () => {
      const results: (RouteInfo & { geometry: [number, number][] })[] = [];

      await Promise.all(
        hospitals.map(async (h) => {
          const route = await fetchOSRMRoute(routeOrigin, { lat: h.lat, lng: h.lng });
          if (route) {
            results.push({
              hospitalId: h.id,
              hospitalName: h.name,
              distanceKm: route.distanceKm,
              etaMinutes: route.etaMinutes,
              isFastest: false,
              geometry: route.geometry,
            });
          }
        })
      );

      // Sort by ETA and mark fastest
      results.sort((a, b) => a.etaMinutes - b.etaMinutes);
      if (results.length > 0) results[0].isFastest = true;

      // Draw routes
      results.forEach((r) => {
        const color = r.isFastest ? "hsl(160,70%,45%)" : "hsl(215,15%,35%)";
        const line = L.polyline(r.geometry, {
          color,
          weight: r.isFastest ? 4 : 2,
          opacity: r.isFastest ? 0.9 : 0.4,
          dashArray: r.isFastest ? undefined : "8 6",
        }).addTo(map);
        line.bindTooltip(`${r.hospitalName}: ${r.distanceKm} km · ${r.etaMinutes} min`, { sticky: true, className: "leaflet-dark-tooltip" });
        routeLinesRef.current.push(line);
      });

      // Add origin marker
      const originMarker = L.circleMarker([routeOrigin.lat, routeOrigin.lng], {
        radius: 8, fillColor: "hsl(0,85%,55%)", fillOpacity: 0.9, color: "#fff", weight: 2,
      }).addTo(map);
      originMarker.bindTooltip("Emergency Location", { className: "leaflet-dark-tooltip" });
      routeLinesRef.current.push(originMarker as unknown as L.Polyline);

      const routeInfos: RouteInfo[] = results.map(({ geometry, ...rest }) => rest);
      setRoutes(routeInfos);
      onRoutesCalculated?.(routeInfos);

      // Fit bounds
      if (results.length > 0) {
        const allPoints: [number, number][] = [[routeOrigin.lat, routeOrigin.lng]];
        results.forEach((r) => allPoints.push(...r.geometry));
        map.fitBounds(L.latLngBounds(allPoints.map((p) => L.latLng(p[0], p[1]))), { padding: [40, 40] });
      }
    };

    calculate();
  }, [showRouting, routeOrigin, hospitals, onRoutesCalculated]);

  return (
    <div className={`relative overflow-hidden rounded-xl border border-border ${className}`}>
      <div ref={containerRef} className="h-full w-full" style={{ minHeight: 200 }} />

      {/* Legend */}
      {showLegend && (
        <div className="absolute bottom-3 left-3 z-[1000] flex items-center gap-3 rounded-lg border border-border bg-card/90 backdrop-blur-sm px-3 py-2">
          {[
            { color: "bg-stable", label: "Operational" },
            { color: "bg-warning", label: "High Load" },
            { color: "bg-emergency", label: "Critical" },
          ].map((item) => (
            <span key={item.label} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className={`h-2 w-2 rounded-full ${item.color}`} />
              {item.label}
            </span>
          ))}
        </div>
      )}

      {/* Route comparison panel */}
      {showRouting && routes.length > 0 && (
        <div className="absolute top-3 left-3 z-[1000] max-w-xs rounded-xl border border-border bg-card/95 backdrop-blur-sm p-3 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <Navigation className="h-3.5 w-3.5 text-info" />
            <span className="text-xs font-semibold text-foreground">Hospital ETA Comparison</span>
          </div>
          {routes.map((r) => (
            <div
              key={r.hospitalId}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-[11px] ${
                r.isFastest
                  ? "border border-stable/40 bg-stable/10"
                  : "border border-border bg-muted/30"
              }`}
            >
              <div>
                <div className={`font-medium ${r.isFastest ? "text-stable" : "text-foreground"}`}>
                  {r.hospitalName}
                  {r.isFastest && (
                    <span className="ml-2 rounded bg-stable/20 px-1.5 py-0.5 text-[9px] font-bold text-stable uppercase">
                      Recommended
                    </span>
                  )}
                </div>
                <div className="text-muted-foreground mt-0.5">
                  {r.distanceKm} km · {r.etaMinutes} min
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Coordinate overlay */}
      <div className="absolute top-3 right-3 z-[1000] rounded-lg border border-border bg-card/90 backdrop-blur-sm px-3 py-1.5 font-mono text-[9px] text-muted-foreground">
        New Delhi · 28.61°N 77.21°E
      </div>
    </div>
  );
};

export default LiveMap;

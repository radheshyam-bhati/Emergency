const toRadians = (value: number) => (value * Math.PI) / 180;

export const calculateDistanceKm = (
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
) => {
  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(toLat - fromLat);
  const longitudeDelta = toRadians(toLng - fromLng);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(fromLat)) *
      Math.cos(toRadians(toLat)) *
      Math.sin(longitudeDelta / 2) ** 2;

  return Number((earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));
};

const buildInterpolatedRoute = (
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  segments = 8,
): [number, number][] => {
  if (segments < 2) {
    return [
      [origin.lat, origin.lng],
      [destination.lat, destination.lng],
    ];
  }

  const latitudeDelta = destination.lat - origin.lat;
  const longitudeDelta = destination.lng - origin.lng;
  const curveScale = Math.max(Math.abs(latitudeDelta), Math.abs(longitudeDelta)) * 0.16;
  const controlPoint = {
    lat: origin.lat + latitudeDelta / 2 + curveScale,
    lng: origin.lng + longitudeDelta / 2 - curveScale,
  };

  return Array.from({ length: segments + 1 }, (_, index) => {
    const progress = index / segments;
    const inverse = 1 - progress;
    const lat =
      inverse * inverse * origin.lat +
      2 * inverse * progress * controlPoint.lat +
      progress * progress * destination.lat;
    const lng =
      inverse * inverse * origin.lng +
      2 * inverse * progress * controlPoint.lng +
      progress * progress * destination.lng;

    return [Number(lat.toFixed(5)), Number(lng.toFixed(5))] as [number, number];
  });
};

const parseOsrmRoute = (payload: unknown): { geometry: [number, number][]; distanceKm: number; etaMinutes: number } | null => {
  if (
    !payload ||
    typeof payload !== "object" ||
    !("code" in payload) ||
    payload.code !== "Ok" ||
    !("routes" in payload) ||
    !Array.isArray(payload.routes) ||
    payload.routes.length === 0
  ) {
    return null;
  }

  const primaryRoute = payload.routes[0] as {
    distance?: number;
    duration?: number;
    geometry?: { coordinates?: number[][] };
  };

  if (
    typeof primaryRoute.distance !== "number" ||
    typeof primaryRoute.duration !== "number" ||
    !primaryRoute.geometry ||
    !Array.isArray(primaryRoute.geometry.coordinates)
  ) {
    return null;
  }

  const geometry = primaryRoute.geometry.coordinates.flatMap((point) => {
    if (!Array.isArray(point) || point.length < 2) {
      return [];
    }

    const [lng, lat] = point;
    return typeof lat === "number" && typeof lng === "number"
      ? [[Number(lat.toFixed(5)), Number(lng.toFixed(5))] as [number, number]]
      : [];
  });

  if (geometry.length < 2) {
    return null;
  }

  return {
    geometry,
    distanceKm: Number((primaryRoute.distance / 1000).toFixed(1)),
    etaMinutes: Math.max(3, Math.round(primaryRoute.duration / 60)),
  };
};

export const getRoutePlan = async (
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
) => {
  const fallbackDistanceKm = calculateDistanceKm(origin.lat, origin.lng, destination.lat, destination.lng);
  const fallbackEtaMinutes = Math.max(4, Math.round(fallbackDistanceKm * 2.6 + 3));
  const fallbackGeometry = buildInterpolatedRoute(origin, destination);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      return {
        geometry: fallbackGeometry,
        distanceKm: fallbackDistanceKm,
        etaMinutes: fallbackEtaMinutes,
      };
    }

    const payload = (await response.json()) as unknown;
    const route = parseOsrmRoute(payload);

    return (
      route ?? {
        geometry: fallbackGeometry,
        distanceKm: fallbackDistanceKm,
        etaMinutes: fallbackEtaMinutes,
      }
    );
  } catch {
    return {
      geometry: fallbackGeometry,
      distanceKm: fallbackDistanceKm,
      etaMinutes: fallbackEtaMinutes,
    };
  }
};

export const getProgressIncrement = (etaMinutes: number | null) => {
  if (!etaMinutes || etaMinutes <= 0) {
    return 0.18;
  }

  return Math.min(0.34, Math.max(0.08, 5 / (etaMinutes * 60)));
};

export const getPositionAlongRoute = (
  route: [number, number][],
  progress: number,
) => {
  if (route.length === 0) {
    return null;
  }

  if (route.length === 1 || progress <= 0) {
    const [lat, lng] = route[0];
    return { lat, lng };
  }

  if (progress >= 1) {
    const [lat, lng] = route[route.length - 1];
    return { lat, lng };
  }

  const segmentLengths = route.slice(1).map((point, index) =>
    calculateDistanceKm(route[index][0], route[index][1], point[0], point[1]),
  );
  const totalLength = segmentLengths.reduce((sum, value) => sum + value, 0);

  if (totalLength === 0) {
    const [lat, lng] = route[route.length - 1];
    return { lat, lng };
  }

  const targetDistance = totalLength * progress;
  let traversed = 0;

  for (let index = 0; index < segmentLengths.length; index += 1) {
    const segmentLength = segmentLengths[index];

    if (traversed + segmentLength >= targetDistance) {
      const localProgress = segmentLength === 0 ? 1 : (targetDistance - traversed) / segmentLength;
      const start = route[index];
      const end = route[index + 1];

      return {
        lat: Number((start[0] + (end[0] - start[0]) * localProgress).toFixed(5)),
        lng: Number((start[1] + (end[1] - start[1]) * localProgress).toFixed(5)),
      };
    }

    traversed += segmentLength;
  }

  const [lat, lng] = route[route.length - 1];
  return { lat, lng };
};

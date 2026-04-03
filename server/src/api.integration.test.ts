// @vitest-environment node

import "dotenv/config";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { authController } from "./controllers/auth.controller.js";
import { emergenciesController } from "./controllers/emergencies.controller.js";
import { hospitalsController } from "./controllers/hospitals.controller.js";
import { metricsController } from "./controllers/metrics.controller.js";
import { getDb } from "./db/client.js";
import { seedDatabase } from "./db/seed.js";
import { ambulanceModel } from "./models/ambulance.model.js";
import { dispatchModel } from "./models/dispatch.model.js";
import { hospitalModel } from "./models/hospital.model.js";
import { authenticate } from "./middleware/auth.middleware.js";
import { operationsService } from "./services/operations.service.js";
import { seaeService } from "./services/seae.service.js";

const loginPayload = {
  email: "admin@gmail.com",
  password: "admin@123",
};

type MockRequestShape = Partial<Request> & {
  body?: unknown;
  params?: Record<string, string>;
  headers: Record<string, string>;
  user?: Request["user"];
};

type MockResponseShape<T> = Partial<Response> & {
  statusCode: number;
  payload: T | null;
  headers: Record<string, string>;
  locals: Record<string, unknown>;
  finished: boolean;
};

const createMockRequest = (overrides: Partial<MockRequestShape> = {}): Request =>
  ({
    body: undefined,
    params: {},
    headers: {},
    ...overrides,
  }) as Request;

const createMockResponse = <T>(): MockResponseShape<T> =>
  ({
    statusCode: 200,
    payload: null,
    headers: {},
    locals: {},
    finished: false,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: T) {
      this.payload = payload;
      this.finished = true;
      return this;
    },
    send(payload: T) {
      this.payload = payload;
      this.finished = true;
      return this;
    },
    setHeader(name: string, value: string | readonly string[]) {
      const normalizedValue = typeof value === "string" ? value : value.join(", ");
      this.headers[name.toLowerCase()] = normalizedValue;
      return this;
    },
  }) as MockResponseShape<T>;

const invokeHandler = async <T>(handler: RequestHandler, request: Request) => {
  const response = createMockResponse<T>();

  await Promise.resolve(handler(request, response as Response, (() => undefined) as NextFunction));

  return {
    response,
    payload: response.payload as T,
  };
};

const invokeProtectedHandler = async <T>(handler: RequestHandler, request: Request) => {
  const response = createMockResponse<T>();
  let nextCalled = false;

  await Promise.resolve(
    authenticate(request, response as Response, (() => {
      nextCalled = true;
    }) as NextFunction),
  );

  if (nextCalled) {
    await Promise.resolve(handler(request, response as Response, (() => undefined) as NextFunction));
  }

  return {
    response,
    payload: response.payload as T,
    request,
  };
};

const login = async () => {
  const request = createMockRequest({ body: loginPayload });
  const { payload } = await invokeHandler<{ token: string }>(authController.login, request);

  return payload.token;
};

describe("Rapid Rescue Grid API", () => {
  beforeEach(() => {
    operationsService.stopLifecycleLoop();
    seedDatabase({ reset: true });
  });

  afterEach(() => {
    operationsService.stopLifecycleLoop();
  });

  it("logs in and reaches a protected endpoint", async () => {
    const token = await login();
    const request = createMockRequest({
      headers: { authorization: `Bearer ${token}` },
    });
    const { response, payload } = await invokeProtectedHandler<Array<{ id: number }>>(hospitalsController.list, request);

    expect(response.statusCode).toBe(200);
    expect(payload.length).toBeGreaterThan(0);
  });

  it("creates and assigns an emergency atomically with explainable rejections", async () => {
    const token = await login();
    const request = createMockRequest({
      headers: { authorization: `Bearer ${token}` },
      body: {
        patientName: "Integration Patient",
        patientPhone: "+91 9999999999",
        condition: "Cardiac Arrest",
        severity: "critical",
        pickupAddress: "India Gate, Delhi",
        pickupLatitude: 28.6129,
        pickupLongitude: 77.2295,
      },
    });

    const { response, payload } = await invokeProtectedHandler<{
      emergency: { id: number };
      dispatch: { id: number; status: string };
      decision: { rejectedOptions: Array<{ reason: string; kind: string }>; replay: Array<{ code: string }> };
      hospital: { id: number };
      ambulance: { id: number; type: string };
    }>(emergenciesController.createAndAssign, request);

    expect(response.statusCode).toBe(201);
    expect(payload.emergency.id).toBeGreaterThan(0);
    expect(payload.dispatch.status).toBe("assigned");
    expect(payload.hospital.id).toBeGreaterThan(0);
    expect(payload.ambulance.type).toBe("ALS");
    expect(
      payload.decision.rejectedOptions.some(
        (option) => option.kind === "ambulance" && option.reason === "Not ALS for critical case",
      ),
    ).toBe(true);
    expect(payload.decision.replay.some((step) => step.code === "dispatch_selected")).toBe(true);
    expect(dispatchModel.list().filter((dispatch) => dispatch.emergencyId === payload.emergency.id)).toHaveLength(1);
  });

  it("retries queued cases and escalates after the configured threshold", async () => {
    const token = await login();
    getDb().prepare("UPDATE ambulances SET status = 'assigned' WHERE id = 5").run();

    const request = createMockRequest({
      headers: { authorization: `Bearer ${token}` },
      body: {
        patientName: "Queue Patient",
        patientPhone: "+91 9888888888",
        condition: "Cardiac Arrest",
        severity: "critical",
        pickupAddress: "Rajpath, Delhi",
        pickupLatitude: 28.6143,
        pickupLongitude: 77.1997,
      },
    });

    const { payload } = await invokeProtectedHandler<{
      emergency: { id: number };
      dispatch: { status: string };
      decision: { fallbackStrategy: string };
    }>(emergenciesController.createAndAssign, request);

    expect(payload.dispatch.status).toBe("queued");
    expect(payload.decision.fallbackStrategy).toBe("waitlist");

    await seaeService.assignEmergency(payload.emergency.id, { isRetry: true });
    await seaeService.assignEmergency(payload.emergency.id, { isRetry: true });
    await seaeService.assignEmergency(payload.emergency.id, { isRetry: true });

    const escalatedDispatch = dispatchModel.getByEmergencyId(payload.emergency.id);
    expect(escalatedDispatch?.retryCount).toBe(3);
    expect(escalatedDispatch?.escalatedAt).not.toBeNull();
    expect(escalatedDispatch?.rankingSnapshot.fallbackStrategy).toBe("manual-escalation");
  });

  it("completes an arrived dispatch, releases resources, and updates metrics", async () => {
    const token = await login();
    const baselineHospital = hospitalModel.getById(4);
    const baselineAvailableAmbulances = ambulanceModel.list().filter((ambulance) => ambulance.status === "available").length;
    const emergencyRequest = createMockRequest({
      headers: { authorization: `Bearer ${token}` },
      body: {
        patientName: "Completion Patient",
        patientPhone: "+91 9777777777",
        condition: "Chest Pain",
        severity: "serious",
        pickupAddress: "Nehru Place, Delhi",
        pickupLatitude: 28.5494,
        pickupLongitude: 77.2514,
      },
    });

    const { payload } = await invokeProtectedHandler<{
      emergency: { id: number };
      hospital: { id: number };
      ambulance: { id: number };
    }>(emergenciesController.createAndAssign, emergencyRequest);

    getDb()
      .prepare(`
        UPDATE dispatches
        SET status = 'arrived', arrived_at = ?, route_phase = 'completed', eta_minutes = 0
        WHERE emergency_id = ?
      `)
      .run(new Date(Date.now() - 10_000).toISOString(), payload.emergency.id);
    getDb().prepare("UPDATE emergencies SET status = 'arrived' WHERE id = ?").run(payload.emergency.id);

    await operationsService.runOperationalTick();

    const completedDispatch = dispatchModel.getByEmergencyId(payload.emergency.id);
    const releasedHospital = hospitalModel.getById(payload.hospital.id);
    const metricsRequest = createMockRequest({
      headers: { authorization: `Bearer ${token}` },
    });
    const metricsResponse = await invokeProtectedHandler<{
      insights: { successRate: number };
      summary: { availableAmbulances: number };
    }>(metricsController.detail, metricsRequest);

    expect(completedDispatch?.status).toBe("completed");
    expect(releasedHospital?.emergencyBeds.available).toBeGreaterThanOrEqual(baselineHospital?.emergencyBeds.available ?? 0);
    expect(
      ambulanceModel.list().filter((ambulance) => ambulance.status === "available").length,
    ).toBeGreaterThanOrEqual(baselineAvailableAmbulances);
    expect(metricsResponse.payload.insights.successRate).toBeGreaterThan(0);
    expect(metricsResponse.payload.summary.availableAmbulances).toBeGreaterThan(0);
  });
});

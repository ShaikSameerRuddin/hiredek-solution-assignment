import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { JsonStore } from "../src/store/jsonStore.js";

const seedDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../seed_data");

describe("booking API", () => {
  let dataDir = "";
  let app: ReturnType<typeof createApp>;
  let patientToken = "";
  let opticianToken = "";

  beforeAll(async () => {
    dataDir = await mkdtemp(path.join(tmpdir(), "eyecare-"));
    const store = new JsonStore(dataDir, seedDir);
    await store.bootstrap();
    app = createApp(store);

    const patient = await request(app).post("/auth/login").send({ email: "james@gmail.com", password: "james" });
    patientToken = patient.body.token;
    const optician = await request(app).post("/auth/login").send({ email: "mary@gmail.com", password: "mary" });
    opticianToken = optician.body.token;
  });

  afterAll(async () => {
    if (dataDir) {
      await rm(dataDir, { recursive: true, force: true });
    }
  });

  it("rejects a bad password and omits secrets from a successful login", async () => {
    const denied = await request(app).post("/auth/login").send({ email: "james@gmail.com", password: "wrong" });
    expect(denied.status).toBe(401);

    const ok = await request(app).post("/auth/login").send({ email: "james@gmail.com", password: "james" });
    expect(ok.status).toBe(200);
    expect(ok.body.user.role).toBe("patient");
    expect(ok.body.user.email).toBe("james@gmail.com");
    expect(ok.body.user.password).toBeUndefined();
    expect(ok.body.token).toEqual(expect.any(String));
  });

  it("requires a valid token and hides passwords from the user list", async () => {
    const missing = await request(app).get("/users");
    expect(missing.status).toBe(401);

    const invalid = await request(app).get("/users").set("Authorization", "Bearer not-a-token");
    expect(invalid.status).toBe(401);

    const forbidden = await request(app).get("/users").set("Authorization", `Bearer ${patientToken}`);
    expect(forbidden.status).toBe(403);

    const allowed = await request(app).get("/users").set("Authorization", `Bearer ${opticianToken}`);
    expect(allowed.status).toBe(200);
    expect(allowed.body.every((user: { password?: string }) => user.password === undefined)).toBe(true);
  });

  it("rejects a catalogue mismatch, a cross-clinic day, and a double booking", async () => {
    const mismatch = await request(app)
      .post("/appointment")
      .set("Authorization", `Bearer ${patientToken}`)
      .send({
        clinicId: "clinic-lakeside",
        opticianId: "opt-alice",
        serviceId: "svc-consult",
        appointmentDatetime: "2026-10-22T09:00:00",
      });
    expect(mismatch.status).toBe(400);

    const otherClinic = await request(app)
      .post("/appointment")
      .set("Authorization", `Bearer ${patientToken}`)
      .send({
        clinicId: "clinic-downtown",
        opticianId: "opt-mary",
        serviceId: "svc-consult",
        appointmentDatetime: "2026-10-15T09:00:00",
      });
    expect(otherClinic.status).toBe(409);

    const first = await request(app)
      .post("/appointment")
      .set("Authorization", `Bearer ${patientToken}`)
      .send({
        clinicId: "clinic-downtown",
        opticianId: "opt-alice",
        serviceId: "svc-consult",
        appointmentDatetime: "2026-10-22T09:00:00",
        notes: "First visit",
      });
    expect(first.status).toBe(201);
    expect(first.body.notes).toBe("First visit");
    expect(first.body.password).toBeUndefined();

    const duplicate = await request(app)
      .post("/appointment")
      .set("Authorization", `Bearer ${patientToken}`)
      .send({
        clinicId: "clinic-downtown",
        opticianId: "opt-alice",
        serviceId: "svc-consult",
        appointmentDatetime: "2026-10-22T09:00:00",
      });
    expect(duplicate.status).toBe(409);

    const patientClash = await request(app)
      .post("/appointment")
      .set("Authorization", `Bearer ${patientToken}`)
      .send({
        clinicId: "clinic-downtown",
        opticianId: "opt-mary",
        serviceId: "svc-consult",
        appointmentDatetime: "2026-10-22T09:00:00",
      });
    expect(patientClash.status).toBe(409);
  });

  it("lets an optician open a patient profile without a password", async () => {
    const response = await request(app)
      .get("/patients/user-wang")
      .set("Authorization", `Bearer ${opticianToken}`);
    expect(response.status).toBe(200);
    expect(response.body.patient.email).toBe("wtang4@gmail.com");
    expect(response.body.patient.password).toBeUndefined();
    expect(response.body.appointments.length).toBeGreaterThan(0);

    const denied = await request(app)
      .get("/patients/user-wang")
      .set("Authorization", `Bearer ${patientToken}`);
    expect(denied.status).toBe(403);
  });
});

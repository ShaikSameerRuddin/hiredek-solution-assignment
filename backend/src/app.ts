import "./types/express.js";
import express, { type RequestHandler } from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import { logger } from "./logger.js";
import { HttpError } from "./errors.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { requireAuth, requireRole } from "./middleware/auth.js";
import { login, toPublicUser } from "./services/authService.js";
import {
  appointmentSchema,
  availabilityQuerySchema,
  catalogueQuerySchema,
  clinicSchema,
  loginSchema,
  opticianSchema,
  userSchema,
} from "./validation/schemas.js";
import { z } from "zod";
import { buildCatalogue, filterCatalogue } from "./domain/catalogue.js";
import { createAppointment, getAvailability } from "./services/bookingService.js";
import { newId } from "./domain/time.js";
import type { JsonStore } from "./store/jsonStore.js";
import type { Appointment, PublicUser } from "./types.js";

const serviceSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().default(""),
});

function asyncHandler(handler: RequestHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function enrichAppointment(
  appointment: Appointment,
  database: Awaited<ReturnType<JsonStore["read"]>>,
) {
  const clinic = database.clinics.find((item) => item.id === appointment.clinicId);
  const service = database.services.find((item) => item.id === appointment.serviceId);
  const optician = database.opticians.find((item) => item.id === appointment.opticianId);
  const patient = database.users.find((item) => item.id === appointment.patientId);
  return {
    ...appointment,
    clinicName: clinic?.name ?? "",
    serviceName: service?.name ?? "",
    opticianName: optician?.name ?? "",
    patientName: patient ? `${patient.firstName} ${patient.lastName}` : "",
  };
}

export function createApp(store: JsonStore) {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use((req, _res, next) => {
    if (req.url === "/api" || req.url.startsWith("/api/") || req.url.startsWith("/api?")) {
      req.url = req.url.slice(4) || "/";
    }
    next();
  });
  app.use((req, res, next) => {
    const started = Date.now();
    res.on("finish", () => {
      logger.info(
        { method: req.method, url: req.originalUrl, status: res.statusCode, ms: Date.now() - started },
        "request",
      );
    });
    next();
  });

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.post(
    "/auth/login",
    asyncHandler(async (req, res) => {
      const body = loginSchema.parse(req.body);
      const result = await login(store, body.email, body.password);
      res.json(result);
    }),
  );

  app.get(
    "/auth/me",
    requireAuth,
    asyncHandler(async (req, res) => {
      const database = await store.read();
      const user = database.users.find((candidate) => candidate.id === req.auth?.sub);
      if (!user) {
        throw new HttpError(401, "Authentication required");
      }
      res.json({ user: toPublicUser(user) });
    }),
  );

  app.get(
    "/clinics",
    requireAuth,
    asyncHandler(async (_req, res) => {
      const database = await store.read();
      res.json(database.clinics);
    }),
  );

  app.post(
    "/clinic",
    requireAuth,
    requireRole("optician"),
    asyncHandler(async (req, res) => {
      const body = clinicSchema.parse(req.body);
      const clinic = await store.update((database) => {
        const known = new Set(database.opticians.map((optician) => optician.id));
        if (body.opticianIds.some((id) => !known.has(id))) {
          throw new HttpError(400, "Clinic references an unknown optician");
        }
        database.clinics.push({ id: newId(), ...body });
      });
      res.status(201).json(clinic.clinics[clinic.clinics.length - 1]);
    }),
  );

  app.get(
    "/services",
    requireAuth,
    asyncHandler(async (_req, res) => {
      const database = await store.read();
      res.json(database.services);
    }),
  );

  app.post(
    "/service",
    requireAuth,
    requireRole("optician"),
    asyncHandler(async (req, res) => {
      const body = serviceSchema.parse(req.body);
      const database = await store.update((current) => {
        current.services.push({ id: newId(), name: body.name, description: body.description });
      });
      res.status(201).json(database.services[database.services.length - 1]);
    }),
  );

  app.get(
    "/opticians",
    requireAuth,
    asyncHandler(async (_req, res) => {
      const database = await store.read();
      res.json(database.opticians);
    }),
  );

  app.post(
    "/optician",
    requireAuth,
    requireRole("optician"),
    asyncHandler(async (req, res) => {
      const body = opticianSchema.parse(req.body);
      const database = await store.update((current) => {
        const known = new Set(current.services.map((service) => service.id));
        if (body.serviceIds.some((id) => !known.has(id))) {
          throw new HttpError(400, "Optician references an unknown service");
        }
        current.opticians.push({ id: newId(), ...body });
      });
      res.status(201).json(database.opticians[database.opticians.length - 1]);
    }),
  );

  app.get(
    "/users",
    requireAuth,
    requireRole("optician"),
    asyncHandler(async (_req, res) => {
      const database = await store.read();
      const users: PublicUser[] = database.users.map(toPublicUser);
      res.json(users);
    }),
  );

  app.post(
    "/user",
    requireAuth,
    requireRole("optician"),
    asyncHandler(async (req, res) => {
      const body = userSchema.parse(req.body);
      const database = await store.update(async (current) => {
        if (current.users.some((user) => user.email.toLowerCase() === body.email.toLowerCase())) {
          throw new HttpError(409, "A user with that email already exists");
        }
        if (body.role === "optician") {
          if (!body.opticianId || !current.opticians.some((optician) => optician.id === body.opticianId)) {
            throw new HttpError(400, "Optician users must link to an existing optician profile");
          }
        }
        current.users.push({
          id: newId(),
          email: body.email,
          password: await bcrypt.hash(body.password, 10),
          role: body.role,
          firstName: body.firstName,
          lastName: body.lastName,
          phoneNumber: body.phoneNumber,
          birthday: body.birthday,
          opticianId: body.role === "optician" ? body.opticianId ?? null : null,
        });
      });
      res.status(201).json(toPublicUser(database.users[database.users.length - 1]));
    }),
  );

  app.get(
    "/catalogue-table",
    requireAuth,
    asyncHandler(async (req, res) => {
      const query = catalogueQuerySchema.parse(req.query);
      const database = await store.read();
      const rows = filterCatalogue(
        buildCatalogue(database.services, database.clinics, database.opticians),
        query,
      );
      res.json(rows);
    }),
  );

  app.get(
    "/availability",
    requireAuth,
    asyncHandler(async (req, res) => {
      const query = availabilityQuerySchema.parse(req.query);
      res.json(await getAvailability(store, query));
    }),
  );

  app.get(
    "/appointments",
    requireAuth,
    asyncHandler(async (req, res) => {
      const database = await store.read();
      const auth = req.auth;
      if (!auth) {
        throw new HttpError(401, "Authentication required");
      }
      const visible = database.appointments.filter((appointment) => {
        if (auth.role === "patient") {
          return appointment.patientId === auth.sub;
        }
        const optician = database.users.find((user) => user.id === auth.sub);
        return appointment.opticianId === optician?.opticianId;
      });
      visible.sort((left, right) => left.appointmentDatetime.localeCompare(right.appointmentDatetime));
      res.json(visible.map((appointment) => enrichAppointment(appointment, database)));
    }),
  );

  app.post(
    "/appointment",
    requireAuth,
    requireRole("patient"),
    asyncHandler(async (req, res) => {
      const body = appointmentSchema.parse(req.body);
      const created = await createAppointment(store, req.auth!.sub, body);
      const database = await store.read();
      res.status(201).json(enrichAppointment(created, database));
    }),
  );

  app.get(
    "/patients/:id",
    requireAuth,
    requireRole("optician"),
    asyncHandler(async (req, res) => {
      const database = await store.read();
      const patient = database.users.find((user) => user.id === req.params.id && user.role === "patient");
      if (!patient) {
        throw new HttpError(404, "Patient not found");
      }
      const history = database.appointments
        .filter((appointment) => appointment.patientId === patient.id)
        .sort((left, right) => right.appointmentDatetime.localeCompare(left.appointmentDatetime))
        .map((appointment) => enrichAppointment(appointment, database));
      res.json({ patient: toPublicUser(patient), appointments: history });
    }),
  );

  app.use(errorHandler);
  return app;
}

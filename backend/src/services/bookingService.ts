import { HttpError } from "../errors.js";
import { catalogueIncludes, buildCatalogue } from "../domain/catalogue.js";
import {
  isOpticianAtOtherClinicOnDate,
  isOpticianSlotTaken,
  isPatientSlotTaken,
  monthAvailability,
} from "../domain/availability.js";
import { isPastDatetime, newId, parseDatetime } from "../domain/time.js";
import type { JsonStore } from "../store/jsonStore.js";
import type { Appointment, Clinic, Optician, Service, User } from "../types.js";

export async function getAvailability(
  store: JsonStore,
  query: { clinicId: string; opticianId: string; serviceId: string; year: number; month: number },
) {
  const database = await store.read();
  assertCatalogueMatch(database, query.serviceId, query.clinicId, query.opticianId);
  const service = mustFind(database.services, query.serviceId, "Service not found");
  const clinic = mustFind(database.clinics, query.clinicId, "Clinic not found");
  const optician = mustFind(database.opticians, query.opticianId, "Optician not found");
  return {
    year: query.year,
    month: query.month,
    service: { id: service.id, name: service.name },
    clinic: { id: clinic.id, name: clinic.name },
    optician: { id: optician.id, name: optician.name },
    days: monthAvailability({
      year: query.year,
      month: query.month,
      clinicId: query.clinicId,
      opticianId: query.opticianId,
      appointments: database.appointments,
    }),
  };
}

export async function createAppointment(
  store: JsonStore,
  patientId: string,
  input: {
    clinicId: string;
    opticianId: string;
    serviceId: string;
    appointmentDatetime: string;
    notes?: string;
  },
): Promise<Appointment> {
  const parsed = parseDatetime(input.appointmentDatetime);
  if (!parsed) {
    throw new HttpError(400, "Choose one of the eight daily timeslots");
  }
  if (isPastDatetime(input.appointmentDatetime)) {
    throw new HttpError(400, "That timeslot has already passed");
  }

  let created: Appointment | undefined;
  await store.update((database) => {
    const patient = database.users.find((user) => user.id === patientId && user.role === "patient");
    if (!patient) {
      throw new HttpError(403, "Only patients can book appointments");
    }
    assertCatalogueMatch(database, input.serviceId, input.clinicId, input.opticianId);
    if (isPastDatetime(input.appointmentDatetime)) {
      throw new HttpError(400, "That timeslot has already passed");
    }
    if (isOpticianAtOtherClinicOnDate(database.appointments, input.opticianId, input.clinicId, parsed.date)) {
      throw new HttpError(409, "This optician is already booked at another clinic that day");
    }
    if (isOpticianSlotTaken(database.appointments, input.opticianId, input.appointmentDatetime)) {
      throw new HttpError(409, "That timeslot is no longer available");
    }
    if (isPatientSlotTaken(database.appointments, patientId, input.appointmentDatetime)) {
      throw new HttpError(409, "You already have an appointment at that time");
    }
    created = {
      id: newId(),
      patientId,
      opticianId: input.opticianId,
      clinicId: input.clinicId,
      serviceId: input.serviceId,
      appointmentDatetime: input.appointmentDatetime,
      notes: input.notes?.trim() ?? "",
    };
    database.appointments.push(created);
  });
  if (!created) {
    throw new HttpError(500, "Could not create appointment");
  }
  return created;
}

export function assertCatalogueMatch(
  database: { services: Service[]; clinics: Clinic[]; opticians: Optician[] },
  serviceId: string,
  clinicId: string,
  opticianId: string,
): void {
  const rows = buildCatalogue(database.services, database.clinics, database.opticians);
  if (!catalogueIncludes(rows, serviceId, clinicId, opticianId)) {
    throw new HttpError(400, "That service is not offered by this optician at this clinic");
  }
}

function mustFind<T extends { id: string }>(items: T[], id: string, message: string): T {
  const found = items.find((item) => item.id === id);
  if (!found) {
    throw new HttpError(404, message);
  }
  return found;
}

export function findUser(users: User[], id: string): User {
  const user = users.find((candidate) => candidate.id === id);
  if (!user) {
    throw new HttpError(404, "User not found");
  }
  return user;
}

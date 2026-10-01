import { describe, expect, it } from "vitest";
import { monthAvailability } from "../src/domain/availability.js";
import { buildCatalogue, filterCatalogue } from "../src/domain/catalogue.js";
import { parseDatetime, slotLabel } from "../src/domain/time.js";
import type { Appointment, Clinic, Optician, Service } from "../src/types.js";

const services: Service[] = [
  { id: "svc-consult", name: "Consult", description: "" },
  { id: "svc-exam", name: "Comprehensive Eye Exam", description: "" },
];

const opticians: Optician[] = [
  { id: "opt-alice", name: "Alice Smith", intro: "", serviceIds: ["svc-consult", "svc-exam"] },
  { id: "opt-mary", name: "Mary Davis", intro: "", serviceIds: ["svc-consult"] },
];

const clinics: Clinic[] = [
  {
    id: "clinic-downtown",
    name: "Downtown Eye Clinic",
    description: "",
    address: "",
    contact: "",
    opticianIds: ["opt-alice", "opt-mary"],
  },
  {
    id: "clinic-suburban",
    name: "Suburban Optometry",
    description: "",
    address: "",
    contact: "",
    opticianIds: ["opt-mary"],
  },
];

function appointment(partial: Partial<Appointment> & Pick<Appointment, "appointmentDatetime" | "clinicId" | "opticianId">): Appointment {
  return {
    id: partial.id ?? "apt",
    patientId: partial.patientId ?? "user-wang",
    serviceId: partial.serviceId ?? "svc-consult",
    notes: partial.notes ?? "",
    ...partial,
  };
}

describe("timeslots", () => {
  it("accepts the eight daily hours and rejects anything else", () => {
    expect(parseDatetime("2026-10-21T09:00:00")?.hour).toBe(9);
    expect(parseDatetime("2026-10-21T13:00:00")?.hour).toBe(13);
    expect(parseDatetime("2026-10-21T12:00:00")).toBeNull();
    expect(parseDatetime("2026-10-21T09:30:00")).toBeNull();
    expect(slotLabel(13)).toBe("01:00 PM");
    expect(slotLabel(9)).toBe("09:00 AM");
  });
});

describe("availability", () => {
  const now = new Date(2026, 9, 1, 12, 0, 0);
  const appointments = [
    appointment({
      appointmentDatetime: "2026-10-15T11:00:00",
      clinicId: "clinic-suburban",
      opticianId: "opt-mary",
    }),
    appointment({
      id: "apt-2",
      appointmentDatetime: "2026-10-21T10:00:00",
      clinicId: "clinic-downtown",
      opticianId: "opt-alice",
      patientId: "user-james",
    }),
  ];

  it("blocks every slot when the optician is already at another clinic that day", () => {
    const days = monthAvailability({
      year: 2026,
      month: 10,
      clinicId: "clinic-downtown",
      opticianId: "opt-mary",
      appointments,
      now,
    });
    const october15 = days.find((day) => day.date === "2026-10-15");
    expect(october15?.slots.every((slot) => !slot.available)).toBe(true);
  });

  it("keeps other slots open at the clinic where the optician is already booked", () => {
    const days = monthAvailability({
      year: 2026,
      month: 10,
      clinicId: "clinic-suburban",
      opticianId: "opt-mary",
      appointments,
      now,
    });
    const october15 = days.find((day) => day.date === "2026-10-15");
    expect(october15?.slots.find((slot) => slot.time === "11:00")?.available).toBe(false);
    expect(october15?.slots.find((slot) => slot.time === "13:00")?.available).toBe(true);
  });

  it("marks past slots and taken slots unavailable", () => {
    const days = monthAvailability({
      year: 2026,
      month: 10,
      clinicId: "clinic-downtown",
      opticianId: "opt-alice",
      appointments,
      now,
    });
    const october1 = days.find((day) => day.date === "2026-10-01");
    expect(october1?.slots.find((slot) => slot.time === "09:00")?.available).toBe(false);
    expect(october1?.slots.find((slot) => slot.time === "13:00")?.available).toBe(true);
    const october21 = days.find((day) => day.date === "2026-10-21");
    expect(october21?.slots.find((slot) => slot.time === "10:00")?.available).toBe(false);
    expect(october21?.slots.find((slot) => slot.time === "11:00")?.available).toBe(true);
  });
});

describe("catalogue", () => {
  const rows = buildCatalogue(services, clinics, opticians);

  it("only includes opticians employed by the clinic who offer the service", () => {
    expect(rows.some((row) => row.opticianId === "opt-alice" && row.clinicId === "clinic-suburban")).toBe(false);
    expect(rows.some((row) => row.opticianId === "opt-mary" && row.serviceName === "Consult" && row.clinicName === "Downtown Eye Clinic")).toBe(true);
  });

  it("filters by keyword and ids", () => {
    const filtered = filterCatalogue(rows, { q: "alice", serviceId: "svc-exam" });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.clinicName).toBe("Downtown Eye Clinic");
  });
});

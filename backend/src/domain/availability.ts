import type { Appointment, DayAvailability } from "../types.js";
import {
  SLOT_HOURS,
  buildDatetime,
  dateKey,
  daysInMonth,
  formatSlotTime,
  isPastDatetime,
  slotLabel,
} from "./time.js";

export function isOpticianAtOtherClinicOnDate(
  appointments: Appointment[],
  opticianId: string,
  clinicId: string,
  date: string,
): boolean {
  return appointments.some(
    (appointment) =>
      appointment.opticianId === opticianId &&
      appointment.clinicId !== clinicId &&
      appointment.appointmentDatetime.startsWith(`${date}T`),
  );
}

export function isOpticianSlotTaken(
  appointments: Appointment[],
  opticianId: string,
  datetime: string,
): boolean {
  return appointments.some(
    (appointment) =>
      appointment.opticianId === opticianId && appointment.appointmentDatetime === datetime,
  );
}

export function isPatientSlotTaken(
  appointments: Appointment[],
  patientId: string,
  datetime: string,
): boolean {
  return appointments.some(
    (appointment) =>
      appointment.patientId === patientId && appointment.appointmentDatetime === datetime,
  );
}

export function monthAvailability(input: {
  year: number;
  month: number;
  clinicId: string;
  opticianId: string;
  appointments: Appointment[];
  now?: Date;
}): DayAvailability[] {
  const { year, month, clinicId, opticianId, appointments, now = new Date() } = input;
  const totalDays = daysInMonth(year, month);
  const days: DayAvailability[] = [];

  for (let day = 1; day <= totalDays; day += 1) {
    const date = dateKey(year, month, day);
    const blocked = isOpticianAtOtherClinicOnDate(appointments, opticianId, clinicId, date);
    days.push({
      date,
      slots: SLOT_HOURS.map((hour) => {
        const datetime = buildDatetime(date, hour);
        const taken = isOpticianSlotTaken(appointments, opticianId, datetime);
        const past = isPastDatetime(datetime, now);
        return {
          time: formatSlotTime(hour),
          label: slotLabel(hour),
          available: !blocked && !taken && !past,
        };
      }),
    });
  }

  return days;
}

export type Role = "patient" | "optician";

export interface SessionUser {
  id: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  birthday: string;
  opticianId: string | null;
}

export interface CatalogueRow {
  serviceId: string;
  serviceName: string;
  clinicId: string;
  clinicName: string;
  opticianId: string;
  opticianName: string;
}

export interface NamedOption {
  id: string;
  name: string;
}

export interface AppointmentView {
  id: string;
  patientId: string;
  opticianId: string;
  appointmentDatetime: string;
  clinicId: string;
  serviceId: string;
  notes: string;
  clinicName: string;
  serviceName: string;
  opticianName: string;
  patientName: string;
}

export interface SlotAvailability {
  time: string;
  label: string;
  available: boolean;
}

export interface DayAvailability {
  date: string;
  slots: SlotAvailability[];
}

export interface AvailabilityResponse {
  year: number;
  month: number;
  service: NamedOption;
  clinic: NamedOption;
  optician: NamedOption;
  days: DayAvailability[];
}

export interface BookingDraft {
  serviceId: string;
  serviceName: string;
  clinicId: string;
  clinicName: string;
  opticianId: string;
  opticianName: string;
  date: string;
  time: string;
  timeLabel: string;
}

export interface PatientProfile {
  patient: SessionUser;
  appointments: AppointmentView[];
}

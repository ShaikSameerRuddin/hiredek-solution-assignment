export type Role = "patient" | "optician";

export interface User {
  id: string;
  email: string;
  password: string;
  role: Role;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  birthday: string;
  opticianId: string | null;
}

export interface PublicUser {
  id: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  birthday: string;
  opticianId: string | null;
}

export interface Clinic {
  id: string;
  name: string;
  description: string;
  address: string;
  contact: string;
  opticianIds: string[];
}

export interface Optician {
  id: string;
  name: string;
  intro: string;
  serviceIds: string[];
}

export interface Service {
  id: string;
  name: string;
  description: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  opticianId: string;
  appointmentDatetime: string;
  clinicId: string;
  serviceId: string;
  notes: string;
}

export interface Database {
  users: User[];
  clinics: Clinic[];
  opticians: Optician[];
  services: Service[];
  appointments: Appointment[];
}

export interface AuthTokenPayload {
  sub: string;
  role: Role;
  email: string;
}

export interface CatalogueRow {
  serviceId: string;
  serviceName: string;
  clinicId: string;
  clinicName: string;
  opticianId: string;
  opticianName: string;
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

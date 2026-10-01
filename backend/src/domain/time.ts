import { randomUUID } from "node:crypto";

export const SLOT_HOURS = [9, 10, 11, 13, 14, 15, 16, 17] as const;

const DATETIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):00$/;

export function slotLabel(hour: number): string {
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${String(hour12).padStart(2, "0")}:00 ${suffix}`;
}

export function formatSlotTime(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

export function buildDatetime(date: string, hour: number): string {
  return `${date}T${formatSlotTime(hour)}:00`;
}

export function parseDatetime(value: string): { date: string; hour: number; minute: number } | null {
  const match = DATETIME_PATTERN.exec(value);
  if (!match) {
    return null;
  }
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  if (!SLOT_HOURS.includes(hour as (typeof SLOT_HOURS)[number]) || minute !== 0) {
    return null;
  }
  return { date: `${match[1]}-${match[2]}-${match[3]}`, hour, minute };
}

export function toLocalDate(value: string): Date | null {
  const match = DATETIME_PATTERN.exec(value);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const date = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

export function isPastDatetime(value: string, now = new Date()): boolean {
  const date = toLocalDate(value);
  if (!date) {
    return true;
  }
  return date.getTime() <= now.getTime();
}

export function dateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function newId(): string {
  return randomUUID();
}

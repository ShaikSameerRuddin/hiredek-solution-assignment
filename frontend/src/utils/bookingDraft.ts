import type { BookingDraft } from "../types";

const DRAFT_KEY = "eyecare_booking_draft";

export function saveBookingDraft(draft: BookingDraft): void {
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function loadBookingDraft(): BookingDraft | null {
  const raw = sessionStorage.getItem(DRAFT_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as BookingDraft;
    if (!parsed?.serviceId || !parsed.date || !parsed.time) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearBookingDraft(): void {
  sessionStorage.removeItem(DRAFT_KEY);
}

export function markBookingSuccess(): void {
  sessionStorage.setItem("eyecare_booked", "1");
}

export function hasBookingSuccess(): boolean {
  return sessionStorage.getItem("eyecare_booked") === "1";
}

export function clearBookingSuccess(): void {
  sessionStorage.removeItem("eyecare_booked");
}

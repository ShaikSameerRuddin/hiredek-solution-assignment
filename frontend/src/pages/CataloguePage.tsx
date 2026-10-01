import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Modal, Table, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { ActionBar } from "../components/ActionBar";
import { AppHeader } from "../components/AppHeader";
import { MonthCalendar } from "../components/MonthCalendar";
import type { AvailabilityResponse, BookingDraft, CatalogueRow, NamedOption } from "../types";
import { saveBookingDraft } from "../utils/bookingDraft";
import { todayKey } from "../utils/datetime";

export function CataloguePage() {
  const navigate = useNavigate();
  const now = new Date();
  const [services, setServices] = useState<NamedOption[]>([]);
  const [clinics, setClinics] = useState<NamedOption[]>([]);
  const [opticians, setOpticians] = useState<NamedOption[]>([]);
  const [rows, setRows] = useState<CatalogueRow[]>([]);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [serviceId, setServiceId] = useState<string>();
  const [clinicId, setClinicId] = useState<string>();
  const [opticianId, setOpticianId] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<CatalogueRow | null>(null);
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string>();
  const [selectedTime, setSelectedTime] = useState<string>();

  useEffect(() => {
    Promise.all([
      api<NamedOption[]>("/services"),
      api<NamedOption[]>("/clinics"),
      api<NamedOption[]>("/opticians"),
    ])
      .then(([nextServices, nextClinics, nextOpticians]) => {
        setServices(nextServices);
        setClinics(nextClinics);
        setOpticians(nextOpticians);
      })
      .catch((caught: Error) => setError(caught.message));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (serviceId) params.set("serviceId", serviceId);
    if (clinicId) params.set("clinicId", clinicId);
    if (opticianId) params.set("opticianId", opticianId);
    setLoading(true);
    api<CatalogueRow[]>(`/catalogue-table?${params.toString()}`)
      .then(setRows)
      .catch((caught: Error) => setError(caught.message))
      .finally(() => setLoading(false));
  }, [search, serviceId, clinicId, opticianId]);

  useEffect(() => {
    if (!selected) {
      return;
    }
    const params = new URLSearchParams({
      serviceId: selected.serviceId,
      clinicId: selected.clinicId,
      opticianId: selected.opticianId,
      year: String(year),
      month: String(month),
    });
    setAvailabilityLoading(true);
    setAvailabilityError(null);
    api<AvailabilityResponse>(`/availability?${params.toString()}`)
      .then((result) => {
        setAvailability(result);
        setSelectedDate((current) => {
          if (current && result.days.some((day) => day.date === current)) {
            return current;
          }
          const today = todayKey();
          return result.days.some((day) => day.date === today) ? today : result.days[0]?.date;
        });
      })
      .catch((caught: Error) => setAvailabilityError(caught.message))
      .finally(() => setAvailabilityLoading(false));
  }, [selected, year, month]);

  const day = availability?.days.find((item) => item.date === selectedDate);
  const chosenSlot = day?.slots.find((slot) => slot.time === selectedTime && slot.available);

  const filters = useMemo(
    () => [
      {
        ariaLabel: "Filter by service",
        placeholder: "Select Services",
        value: serviceId,
        options: services.map((service) => ({ value: service.id, label: service.name })),
        onChange: setServiceId,
      },
      {
        ariaLabel: "Filter by clinic",
        placeholder: "Select Clinics",
        value: clinicId,
        options: clinics.map((clinic) => ({ value: clinic.id, label: clinic.name })),
        onChange: setClinicId,
      },
      {
        ariaLabel: "Filter by optician",
        placeholder: "Select Opticians",
        value: opticianId,
        options: opticians.map((optician) => ({ value: optician.id, label: optician.name })),
        onChange: setOpticianId,
      },
    ],
    [serviceId, clinicId, opticianId, services, clinics, opticians],
  );

  function closeModal() {
    setSelected(null);
    setAvailability(null);
    setSelectedTime(undefined);
    setAvailabilityError(null);
  }

  function proceed() {
    if (!selected || !selectedDate || !chosenSlot) {
      return;
    }
    const draft: BookingDraft = {
      serviceId: selected.serviceId,
      serviceName: selected.serviceName,
      clinicId: selected.clinicId,
      clinicName: selected.clinicName,
      opticianId: selected.opticianId,
      opticianName: selected.opticianName,
      date: selectedDate,
      time: chosenSlot.time,
      timeLabel: chosenSlot.label,
    };
    saveBookingDraft(draft);
    navigate("/confirm", { state: draft });
  }

  return (
    <>
      <AppHeader title="Find a time" active="catalogue" />
      <main id="main-content" className="page">
        {error ? <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} /> : null}
        <ActionBar
          search={searchDraft}
          onSearchChange={setSearchDraft}
          onSearch={() => setSearch(searchDraft.trim())}
          filters={filters}
        />
        <Table
          rowKey={(row) => `${row.serviceId}-${row.clinicId}-${row.opticianId}`}
          loading={loading}
          dataSource={rows}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          locale={{ emptyText: "No matching providers" }}
          columns={[
            { title: "Service", dataIndex: "serviceName" },
            { title: "Clinic", dataIndex: "clinicName" },
            { title: "Optician", dataIndex: "opticianName" },
            {
              title: "Action",
              render: (_value, row: CatalogueRow) => (
                <Button type="link" onClick={() => setSelected(row)}>
                  Check Availability
                </Button>
              ),
            },
          ]}
        />
      </main>
      <Modal
        open={Boolean(selected)}
        title="Available Slots"
        onCancel={closeModal}
        footer={null}
        width={720}
        destroyOnClose
      >
        {selected ? (
          <>
            <Typography.Paragraph style={{ marginBottom: 4 }}>
              <strong>Service:</strong> {selected.serviceName}
            </Typography.Paragraph>
            <Typography.Paragraph style={{ marginBottom: 4 }}>
              <strong>Clinic:</strong> {selected.clinicName}
            </Typography.Paragraph>
            <Typography.Paragraph style={{ marginBottom: 0 }}>
              <strong>Optician:</strong> {selected.opticianName}
            </Typography.Paragraph>
            {availabilityError ? <Alert type="error" showIcon message={availabilityError} /> : null}
            <MonthCalendar
              year={year}
              month={month}
              selectedDate={selectedDate}
              onSelectDate={(date) => {
                setSelectedDate(date);
                setSelectedTime(undefined);
              }}
              onMonthChange={(nextYear, nextMonth) => {
                setYear(nextYear);
                setMonth(nextMonth);
                setSelectedTime(undefined);
              }}
            />
            <Typography.Paragraph strong>
              Available Timeslots for {selectedDate ?? "the selected date"}
            </Typography.Paragraph>
            <div className="slot-grid">
              {(day?.slots ?? []).map((slot) => (
                <button
                  key={slot.time}
                  type="button"
                  disabled={!slot.available || availabilityLoading}
                  className={selectedTime === slot.time ? "selected" : undefined}
                  aria-pressed={selectedTime === slot.time}
                  onClick={() => setSelectedTime(slot.time)}
                >
                  {slot.label}
                </button>
              ))}
            </div>
            {!availabilityLoading && day && day.slots.every((slot) => !slot.available) ? (
              <Typography.Paragraph type="secondary">No timeslots available on this date.</Typography.Paragraph>
            ) : null}
            <div className="slot-footer">
              <div>
                <div>Selected Date: {selectedDate ?? "—"}</div>
                <div>Selected Time: {chosenSlot?.label ?? "—"}</div>
              </div>
              <Button type="primary" disabled={!chosenSlot} onClick={proceed}>
                Proceed
              </Button>
            </div>
          </>
        ) : null}
      </Modal>
    </>
  );
}


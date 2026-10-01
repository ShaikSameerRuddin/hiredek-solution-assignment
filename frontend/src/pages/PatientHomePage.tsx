import { useEffect, useState } from "react";
import { Alert, Table } from "antd";
import { api } from "../api/client";
import { AppHeader } from "../components/AppHeader";
import type { AppointmentView } from "../types";
import { clearBookingSuccess, hasBookingSuccess } from "../utils/bookingDraft";
import { formatTableDate, isUpcoming } from "../utils/datetime";

export function PatientHomePage() {
  const [rows, setRows] = useState<AppointmentView[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [booked, setBooked] = useState(() => hasBookingSuccess());

  useEffect(() => {
    api<AppointmentView[]>("/appointments")
      .then((appointments) => setRows(appointments.filter((appointment) => isUpcoming(appointment.appointmentDatetime))))
      .catch((caught: Error) => setError(caught.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <AppHeader title="Upcoming appointments" active="home" />
      <main id="main-content" className="page">
        <h2>Upcoming Appointments</h2>
        {booked ? (
          <Alert
            type="success"
            showIcon
            closable
            message="Your appointment is booked."
            style={{ marginBottom: 16 }}
            onClose={() => {
              clearBookingSuccess();
              setBooked(false);
            }}
          />
        ) : null}
        {error ? <Alert type="error" showIcon message={error} /> : null}
        <Table
          rowKey="id"
          loading={loading}
          dataSource={rows}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          locale={{ emptyText: "No upcoming appointments" }}
          columns={[
            { title: "Appointment Time", dataIndex: "appointmentDatetime", render: formatTableDate },
            { title: "Clinic", dataIndex: "clinicName" },
            { title: "Service", dataIndex: "serviceName" },
            { title: "Optician", dataIndex: "opticianName" },
            { title: "Notes", dataIndex: "notes", render: (notes: string) => notes || "" },
          ]}
        />
      </main>
    </>
  );
}

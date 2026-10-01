import { useEffect, useState } from "react";
import { Alert, Table } from "antd";
import { api } from "../api/client";
import { AppHeader } from "../components/AppHeader";
import type { AppointmentView } from "../types";
import { formatTableDate, isUpcoming } from "../utils/datetime";

export function PatientHomePage() {
  const [rows, setRows] = useState<AppointmentView[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<AppointmentView[]>("/appointments")
      .then((appointments) => setRows(appointments.filter((appointment) => isUpcoming(appointment.appointmentDatetime))))
      .catch((caught: Error) => setError(caught.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <AppHeader title="Patient: View Patient's Upcoming Appointments" active="home" />
      <main className="page">
        <h2>Upcoming Appointments</h2>
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
            { title: "Notes", dataIndex: "notes", render: (notes: string) => notes || "" },
          ]}
        />
      </main>
    </>
  );
}

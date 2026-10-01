import { useEffect, useState } from "react";
import { Alert, Button, Modal, Spin, Table } from "antd";
import { api } from "../api/client";
import { AppHeader } from "../components/AppHeader";
import { useAuth } from "../auth/AuthContext";
import type { AppointmentView, PatientProfile } from "../types";
import { formatBirthday, formatTableDate, initials, isUpcoming } from "../utils/datetime";

export function OpticianSchedulePage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<AppointmentView[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    api<AppointmentView[]>("/appointments")
      .then((appointments) => setRows(appointments.filter((appointment) => isUpcoming(appointment.appointmentDatetime))))
      .catch((caught: Error) => setError(caught.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!patientId) {
      setProfile(null);
      return;
    }
    setProfileLoading(true);
    setProfileError(null);
    api<PatientProfile>(`/patients/${patientId}`)
      .then(setProfile)
      .catch((caught: Error) => setProfileError(caught.message))
      .finally(() => setProfileLoading(false));
  }, [patientId]);

  const titleName = user ? `${user.firstName}'s` : "Upcoming";

  return (
    <>
      <AppHeader title="Optician: View Optician's Upcoming Appointments" active="schedule" />
      <main className="page">
        <h2>{titleName} Upcoming Appointment</h2>
        {error ? <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} /> : null}
        <Table
          rowKey="id"
          loading={loading}
          dataSource={rows}
          pagination={{ current: page, pageSize: 10, showSizeChanger: false, onChange: setPage }}
          locale={{ emptyText: "No upcoming appointments" }}
          columns={[
            {
              title: "No.",
              width: 70,
              render: (_value, _row, index) => (page - 1) * 10 + index + 1,
            },
            { title: "Appointment Time", dataIndex: "appointmentDatetime", render: formatTableDate },
            { title: "Clinic", dataIndex: "clinicName" },
            { title: "Service", dataIndex: "serviceName" },
            { title: "Notes", dataIndex: "notes" },
            {
              title: "Patient",
              dataIndex: "patientName",
              render: (name: string, row: AppointmentView) => (
                <Button type="link" onClick={() => setPatientId(row.patientId)}>
                  {name}
                </Button>
              ),
            },
          ]}
        />
      </main>
      <Modal
        open={Boolean(patientId)}
        title="Patient Information"
        onCancel={() => setPatientId(null)}
        footer={[
          <Button key="cancel" onClick={() => setPatientId(null)}>
            Cancel
          </Button>,
          <Button key="ok" type="primary" onClick={() => setPatientId(null)}>
            OK
          </Button>,
        ]}
        width={720}
      >
        {profileError ? <Alert type="error" showIcon message={profileError} /> : null}
        {profileLoading && !profile ? <Spin /> : null}
        {profile ? (
          <>
            <div className="patient-summary">
              <div className="initials" aria-hidden="true">
                {initials(profile.patient.firstName, profile.patient.lastName)}
              </div>
              <div className="patient-fields">
                <strong>
                  {profile.patient.firstName} {profile.patient.lastName}
                </strong>
                <div>
                  <span>Email</span>
                  <span>{profile.patient.email}</span>
                </div>
                <div>
                  <span>Phone</span>
                  <span>{profile.patient.phoneNumber}</span>
                </div>
                <div>
                  <span>Birthday</span>
                  <span>{formatBirthday(profile.patient.birthday)}</span>
                </div>
              </div>
            </div>
            <h3>Appointment History</h3>
            <Table
              rowKey="id"
              loading={profileLoading}
              dataSource={profile.appointments}
              pagination={{ pageSize: 3, showSizeChanger: false }}
              columns={[
                { title: "Appointment Time", dataIndex: "appointmentDatetime", render: formatTableDate },
                { title: "Clinic", dataIndex: "clinicName" },
                { title: "Service", dataIndex: "serviceName" },
                { title: "Notes", dataIndex: "notes" },
              ]}
            />
          </>
        ) : null}
      </Modal>
    </>
  );
}

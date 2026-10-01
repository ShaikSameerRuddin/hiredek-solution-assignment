import { useState } from "react";
import { Alert, Button, Form, Input, Select } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { api, ApiError } from "../api/client";
import { AppHeader } from "../components/AppHeader";
import type { BookingDraft } from "../types";
import { formatLongDate } from "../utils/datetime";

export function ConfirmPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const draft = location.state as BookingDraft | null;
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!draft?.serviceId || !draft.date || !draft.time) {
    return (
      <>
        <AppHeader title="Patient: Confirm Appointment Details" active="catalogue" />
        <main className="page">
          <Alert
            type="warning"
            showIcon
            message="Choose a service, clinic, and timeslot before confirming."
            action={
              <Button type="primary" onClick={() => navigate("/catalogue")}>
                Back to catalogue
              </Button>
            }
          />
        </main>
      </>
    );
  }

  return (
    <>
      <AppHeader title="Patient: Confirm Appointment Details" active="catalogue" />
      <main className="page">
        <section className="confirm-card">
          <h2>Confirm Your Appointment</h2>
          {error ? <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} /> : null}
          <Form
            layout="vertical"
            onFinish={async () => {
              setSubmitting(true);
              setError(null);
              try {
                await api("/appointment", {
                  method: "POST",
                  body: JSON.stringify({
                    serviceId: draft.serviceId,
                    clinicId: draft.clinicId,
                    opticianId: draft.opticianId,
                    appointmentDatetime: `${draft.date}T${draft.time}:00`,
                    notes,
                  }),
                });
                navigate("/");
              } catch (caught) {
                setError(caught instanceof ApiError ? caught.message : "Unable to book this appointment");
              } finally {
                setSubmitting(false);
              }
            }}
          >
            <Form.Item label="Service">
              <Select
                disabled
                aria-label="Service"
                value={draft.serviceId}
                options={[{ value: draft.serviceId, label: draft.serviceName }]}
              />
            </Form.Item>
            <Form.Item label="Clinic">
              <Select
                disabled
                aria-label="Clinic"
                value={draft.clinicId}
                options={[{ value: draft.clinicId, label: draft.clinicName }]}
              />
            </Form.Item>
            <Form.Item label="Optician">
              <Select
                disabled
                aria-label="Optician"
                value={draft.opticianId}
                options={[{ value: draft.opticianId, label: draft.opticianName }]}
              />
            </Form.Item>
            <div className="section-label">Booking Information</div>
            <Form.Item label="Selected Date">
              <Input readOnly value={formatLongDate(draft.date)} />
            </Form.Item>
            <Form.Item label="Selected Time">
              <Input readOnly value={draft.timeLabel} />
            </Form.Item>
            <Form.Item label="Remarks">
              <Input.TextArea
                rows={3}
                maxLength={500}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Optional notes for your optician"
              />
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={submitting}>
              Book Appointment
            </Button>
          </Form>
        </section>
      </main>
    </>
  );
}

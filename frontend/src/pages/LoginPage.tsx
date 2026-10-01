import { useState } from "react";
import { Alert, Button, Form, Input } from "antd";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  return (
    <main id="main-content" className="login-screen">
      <section className="login-card">
        <h1>Eye Care App</h1>
          {error ? (
            <Alert type="error" showIcon role="alert" message={error} style={{ marginBottom: 16 }} />
          ) : null}
        <Form
          layout="vertical"
          requiredMark
          onFinish={async (values: { email: string; password: string }) => {
            setSubmitting(true);
            setError(null);
            try {
              const user = await login(values.email, values.password);
              navigate(user.role === "optician" ? "/schedule" : "/");
            } catch (caught) {
              setError(caught instanceof ApiError ? caught.message : "Unable to sign in");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <Form.Item label="Email" name="email" rules={[{ required: true, type: "email", message: "Enter a valid email" }]}>
            <Input placeholder="Enter your email" autoComplete="username" />
          </Form.Item>
          <Form.Item label="Password" name="password" rules={[{ required: true, message: "Enter your password" }]}>
            <Input.Password placeholder="Enter your password" autoComplete="current-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={submitting}>
            Login
          </Button>
        </Form>
      </section>
    </main>
  );
}

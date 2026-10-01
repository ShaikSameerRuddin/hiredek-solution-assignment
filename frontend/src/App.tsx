import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Spin } from "antd";
import { useAuth } from "./auth/AuthContext";
import { CataloguePage } from "./pages/CataloguePage";
import { ConfirmPage } from "./pages/ConfirmPage";
import { LoginPage } from "./pages/LoginPage";
import { OpticianSchedulePage } from "./pages/OpticianSchedulePage";
import { PatientHomePage } from "./pages/PatientHomePage";
import { SharedComponentsPage } from "./pages/SharedComponentsPage";
import type { Role } from "./types";

function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="login-screen">
        <Spin size="large" />
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== role) {
    return <Navigate to={user.role === "optician" ? "/schedule" : "/"} replace />;
  }
  return children;
}

export function App() {
  const { user, loading } = useAuth();
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Routes>
      <Route
        path="/login"
        element={loading ? <Spin /> : user ? <Navigate to={user.role === "optician" ? "/schedule" : "/"} replace /> : <LoginPage />}
      />
      <Route
        path="/"
        element={
          <RequireRole role="patient">
            <PatientHomePage />
          </RequireRole>
        }
      />
      <Route
        path="/catalogue"
        element={
          <RequireRole role="patient">
            <CataloguePage />
          </RequireRole>
        }
      />
      <Route
        path="/confirm"
        element={
          <RequireRole role="patient">
            <ConfirmPage />
          </RequireRole>
        }
      />
      <Route
        path="/shared-components"
        element={
          <RequireRole role="patient">
            <SharedComponentsPage />
          </RequireRole>
        }
      />
      <Route
        path="/schedule"
        element={
          <RequireRole role="optician">
            <OpticianSchedulePage />
          </RequireRole>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
    </>
  );
}

import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ApplicationForm from "./pages/ApplicationForm";
import RiskSummary from "./pages/RiskSummary";

function RequireAuth({ children }: { children: JSX.Element }) {
  const operatorId = localStorage.getItem("operator_id");
  if (!operatorId) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/service/:serviceType"
        element={
          <RequireAuth>
            <ApplicationForm />
          </RequireAuth>
        }
      />
      <Route
        path="/service/:serviceType/risk-summary"
        element={
          <RequireAuth>
            <RiskSummary />
          </RequireAuth>
        }
      />
    </Routes>
  );
}

import { Navigate, Route, Routes } from "react-router-dom";

import LoginPage from "./auth/LoginPage.jsx";
import SignupPage from "./auth/SignupPage.jsx";
import ProtectedRoute from "./auth/ProtectedRoute.jsx";
import AppLayout from "./components/AppLayout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ChildrenList from "./pages/ChildrenList.jsx";
import RegisterChild from "./pages/RegisterChild.jsx";
import ChildProfile from "./pages/ChildProfile.jsx";
import LogMeasurement from "./pages/LogMeasurement.jsx";
import LogDiet from "./pages/LogDiet.jsx";
import MealPlan from "./pages/MealPlan.jsx";
import AlertsDashboard from "./pages/AlertsDashboard.jsx";
import ReportsPage from "./pages/ReportsPage.jsx";
import OfflineStatusIndicator from "./components/OfflineStatusIndicator.jsx";

export default function App() {
  return (
    <>
      <OfflineStatusIndicator />
      <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/children"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ChildrenList />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/children/new"
        element={
          <ProtectedRoute>
            <AppLayout>
              <RegisterChild />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/children/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ChildProfile />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/growth/new"
        element={
          <ProtectedRoute>
            <AppLayout>
              <LogMeasurement />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/nutrition/log"
        element={
          <ProtectedRoute>
            <AppLayout>
              <LogDiet />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/mealplan/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <MealPlan />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/alerts"
        element={
          <ProtectedRoute>
            <AppLayout>
              <AlertsDashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ReportsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

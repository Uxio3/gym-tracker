import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./lib/auth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./components/AppLayout";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { RoutinesPage } from "./pages/RoutinesPage";
import { NewRoutinePage } from "./pages/NewRoutinePage";
import { RoutineDetailPage } from "./pages/RoutineDetailPage";
import { ExercisesPage } from "./pages/ExercisesPage";
import { WorkoutsPage } from "./pages/WorkoutsPage";
import { WorkoutSessionPage } from "./pages/WorkoutSessionPage";

const queryClient = new QueryClient();

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />

                        <Route element={<ProtectedRoute />}>
                            <Route element={<AppLayout />}>
                                <Route path="/" element={<Navigate to="/routines" replace />} />
                                <Route path="/routines" element={<RoutinesPage />} />
                                <Route path="/routines/new" element={<NewRoutinePage />} />
                                <Route path="/routines/:id" element={<RoutineDetailPage />} />
                                <Route path="/exercises" element={<ExercisesPage />} />
                                <Route path="/workouts" element={<WorkoutsPage />} />
                                <Route path="/workouts/:id" element={<WorkoutSessionPage />} />
                            </Route>
                        </Route>

                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </QueryClientProvider>
    );
}

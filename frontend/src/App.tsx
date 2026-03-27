import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import Login from './pages/Login';

import AdminDashboard from './pages/admin/AdminDashboard';
import CoursesAdmin from './pages/admin/CoursesAdmin';
import CourseEditor from './pages/admin/CourseEditor';
import EvaluationsAdmin from './pages/admin/EvaluationsAdmin';
import EvaluationEditor from './pages/admin/EvaluationEditor';
import WorkshopsAdmin from './pages/admin/WorkshopsAdmin';
import UsersAdmin from './pages/admin/UsersAdmin';
import CompaniesAdmin from './pages/admin/CompaniesAdmin';
import GeneralResourcesAdmin from './pages/admin/GeneralResourcesAdmin';

import StudentDashboard from './pages/student/StudentDashboard';
import MyCourses from './pages/student/MyCourses';
import CourseViewer from './pages/student/CourseViewer';
import MyEvaluations from './pages/student/MyEvaluations';
import EvaluationTaker from './pages/student/EvaluationTaker';
import MyWorkshops from './pages/student/MyWorkshops';
import MyGrades from './pages/student/MyGrades';
import InformativeResources from './pages/student/InformativeResources';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="courses" element={<CoursesAdmin />} />
            <Route path="courses/:id" element={<CourseEditor />} />
            <Route path="evaluations" element={<EvaluationsAdmin />} />
            <Route path="evaluations/:id" element={<EvaluationEditor />} />
            <Route path="workshops" element={<WorkshopsAdmin />} />
            <Route path="users" element={<UsersAdmin />} />
            <Route path="companies" element={<CompaniesAdmin />} />
            <Route path="resources" element={<GeneralResourcesAdmin />} />
          </Route>

          {/* Student routes */}
          <Route
            path="/student"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="resources" element={<InformativeResources />} />
            <Route path="courses" element={<MyCourses />} />
            <Route path="courses/:id" element={<CourseViewer />} />
            <Route path="evaluations" element={<MyEvaluations />} />
            <Route path="evaluations/:id" element={<EvaluationTaker />} />
            <Route path="workshops" element={<MyWorkshops />} />
            <Route path="grades" element={<MyGrades />} />
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

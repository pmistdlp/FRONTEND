import { createRouter, createWebHistory } from 'vue-router';
import axios from 'axios';
import Login from '../components/Login.vue';
import AdminDashboard from '../components/admin/Dashboard.vue';
import StaffDashboard from '../components/staff/Dashboard.vue';
import StudentDashboard from '../components/student/Dashboard.vue';
import Enrollment from '../components/Enrollment.vue';

const routes = [
  {
    path: '/',
    name: 'Login',
    component: Login,
  },
  {
    path: '/enrollment/:courseId',
    name: 'Enrollment',
    component: Enrollment,
    props: true,
  },
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: AdminDashboard,
    props: true,
    meta: { requiresAdmin: true },
  },
  {
    path: '/staff',
    name: 'StaffDashboard',
    component: StaffDashboard,
    props: true,
    meta: { requiresStaff: true },
  },
  {
    path: '/student',
    name: 'StudentDashboard',
    component: StudentDashboard,
    props: true,
    meta: { requiresStudent: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

let isCheckingSession = false;

router.beforeEach(async (to, from, next) => {
  console.log('Nav guard check for route:', to.name, 'Path:', to.path);

  // Allow public routes without session check
  if (to.path === '/' || to.path.startsWith('/enrollment/')) {
    return next();
  }

  // Prevent concurrent session checks
  if (isCheckingSession) {
    console.log('Session check already in progress, waiting...');
    return;
  }

  isCheckingSession = true;

  try {
    // Check localStorage first
    const storedUser = JSON.parse(localStorage.getItem('user')) || {};
    console.log('Stored user:', storedUser);

    // Validate backend session
    const response = await axios.get('/api/check-session', { withCredentials: true });
    console.log('Session check response:', response.data);

    const sessionUser = response.data.user;
    if (!sessionUser) {
      console.log('No valid session user, redirecting to /');
      localStorage.removeItem('user');
      return next('/');
    }

    // Update localStorage with session user
    localStorage.setItem('user', JSON.stringify(sessionUser));

    // Check role requirements
    if (to.meta.requiresAdmin && sessionUser.role !== 'admin') {
      console.log('User is not admin, redirecting to /');
      return next('/');
    } else if (to.meta.requiresStaff && sessionUser.role !== 'staff') {
      console.log('User is not staff, redirecting to /');
      return next('/');
    } else if (to.meta.requiresStudent && sessionUser.role !== 'student') {
      console.log('User is not student, redirecting to /');
      return next('/');
    }

    // Role matches, proceed to route
    console.log('Session valid, proceeding to:', to.path);
    return next();
  } catch (error) {
    console.error('Session check error:', error.message);
    localStorage.removeItem('user');
    console.log('Redirecting to / due to session error');
    return next('/');
  } finally {
    isCheckingSession = false;
  }
});

export default router;
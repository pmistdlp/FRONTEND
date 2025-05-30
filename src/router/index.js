import { createRouter, createWebHistory } from 'vue-router';
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

router.beforeEach((to, from, next) => {
  const user = JSON.parse(localStorage.getItem('user')) || {};
  console.log('Nav guard check for route:', to.name, 'User:', user);
  if (to.meta.requiresAdmin && (!user || user.role !== 'admin')) {
    next('/login');
  } else if (to.meta.requiresStaff && (!user || user.role !== 'staff')) {
    next('/login');
  } else if (to.meta.requiresStudent && (!user || user.role !== 'student')) {
    next('/login');
  } else {
    next();
  }
});

export default router;
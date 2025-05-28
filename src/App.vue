<template>
  <div>
    <router-view 
      :user="user" 
      @logout="handleLogout" 
      @login-success="handleLogin" 
      @staff-login="handleStaffLogin" 
      @student-login="handleStudentLogin"
    ></router-view>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      user: null,
      isCheckingSession: false,
    };
  },
  methods: {
    async handleLogin(user) {
      this.user = { ...user, role: 'admin' };
      localStorage.setItem('user', JSON.stringify(this.user));
      console.log('Admin logged in:', this.user);
      await this.$router.push('/admin');
    },
    async handleStaffLogin(user) {
      this.user = { ...user, role: 'staff' };
      localStorage.setItem('user', JSON.stringify(this.user));
      console.log('Staff logged in:', this.user);
      await this.$router.push('/staff');
    },
    async handleStudentLogin(user) {
      this.user = { ...user, role: 'student' };
      localStorage.setItem('user', JSON.stringify(this.user));
      console.log('Student logged in:', this.user);
      await this.$router.push('/student');
    },
    async handleLogout() {
      try {
        await axios.post('/api/logout', {}, { withCredentials: true });
        console.log('Logout request successful');
      } catch (error) {
        console.error('Logout error:', error.message);
      }
      this.user = null;
      localStorage.removeItem('user');
      console.log('User logged out');
      await this.$router.push('/');
    },
    async checkUserSession() {
      if (this.isCheckingSession) return;
      this.isCheckingSession = true;

      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          console.log('Found user in localStorage:', user);

          // Validate backend session
          const response = await axios.get('/api/check-session', { withCredentials: true });
          console.log('Session check response:', response.data);

          if (response.data.user && response.data.user.role === user.role) {
            this.user = response.data.user;
            localStorage.setItem('user', JSON.stringify(this.user));
            const targetRoute = `/${user.role}`;
            if (this.$route.path !== targetRoute) {
              console.log('Redirecting to:', targetRoute);
              await this.$router.push(targetRoute);
            }
          } else {
            console.log('Session mismatch or invalid, clearing session');
            await this.clearSession();
          }
        } else {
          console.log('No user in localStorage');
          await this.clearSession();
        }
      } catch (error) {
        console.error('Session check error:', error.message);
        await this.clearSession();
      } finally {
        this.isCheckingSession = false;
      }
    },
    async clearSession() {
      this.user = null;
      localStorage.removeItem('user');
      if (this.$route.path !== '/') {
        console.log('Redirecting to / for login');
        await this.$router.push('/');
      }
    },
  },
  async created() {
    await this.checkUserSession();
  },
  watch: {
    async '$route'(to) {
      if (!this.user && to.path !== '/' && !this.isCheckingSession) {
        console.log('No user session on route change, checking session');
        await this.checkUserSession();
      }
    },
  },
};
</script>
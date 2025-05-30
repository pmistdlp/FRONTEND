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
export default {
  data() {
    return {
      user: null,
    };
  },
  methods: {
    handleLogin(user) {
      this.user = { ...user, role: 'admin' };
      localStorage.setItem('user', JSON.stringify(this.user));
      console.log('Admin logged in:', this.user);
      this.$router.push('/admin');
    },
    handleStaffLogin(user) {
      this.user = { ...user, role: 'staff' };
      localStorage.setItem('user', JSON.stringify(this.user));
      console.log('Staff logged in:', this.user);
      this.$router.push('/staff');
    },
    handleStudentLogin(user) {
      this.user = { ...user, role: 'student' };
      localStorage.setItem('user', JSON.stringify(this.user));
      console.log('Student logged in:', this.user);
      this.$router.push('/student');
    },
    handleLogout() {
      this.user = null;
      localStorage.removeItem('user');
      console.log('User logged out');
      this.$router.push('/');
    },
    checkUserSession() {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        this.user = JSON.parse(storedUser);
        console.log('Restored user from localStorage:', this.user);
        if (this.user.role === 'admin') this.$router.push('/admin');
        else if (this.user.role === 'staff') this.$router.push('/staff');
        else if (this.user.role === 'student') this.$router.push('/student');
      } else if (this.$route.path !== '/login') {
        console.log('No user session found, redirecting to login');
        this.$router.push('/');
      }
    },
  },
  created() {
    this.checkUserSession();
  },
  watch: {
    '$route'(to) {
      if (!this.user && to.path !== '/login') {
        console.log('No user session on route change, redirecting to login');
        this.$router.push('/');
      }
    },
  },
};
</script>
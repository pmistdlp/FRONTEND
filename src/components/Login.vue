<template>
  <div class="h-screen bg-gradient-to-br from-white to-gray-100 flex flex-col overflow-hidden">
    <!-- Header (Fixed at Top) -->
    <header class="fixed top-0 left-0 right-0 z-10 py-3 px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between bg-white shadow-sm">
      <div class="flex items-center space-x-3">
        <img 
          src="@/images/pmist.png" 
          alt="PMIST Logo" 
          class="w-40 h-auto object-contain cursor-pointer" 
          @click="goToPMU" 
          v-no-right-click
        />
      </div>
      <p class="text-sm font-semibold text-gray-600 text-center sm:text-right mt-2 sm:mt-0">
        Powered by Department of Informatics, PMIST
      </p>
    </header>

    <!-- Main Section -->
    <main class="flex-1 flex flex-col items-center justify-start p-4 sm:p-6 pt-20 sm:pt-24 lg:pt-28 overflow-y-auto">
      <div class="flex flex-col md:flex-row items-center justify-center gap-8 w-full max-w-6xl">
        <!-- Welcome Text -->
        <div class="flex flex-col justify-center space-y-4 text-center md:text-left animate-fade-in md:w-1/2">
          <h2 class="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-800 tracking-tight">
            MOOC Online Examinations
          </h2>
          <p class="text-gray-600 text-sm sm:text-base md:text-lg">
            A reliable and most secured examination platform for MOOC online courses registered under the PMIST.
          </p>
        </div>

        <!-- Login Form -->
        <div class="bg-white w-full max-w-sm sm:max-w-md p-6 sm:p-8 rounded-xl shadow-lg border border-gray-200 transform transition-all duration-300 hover:scale-105 animate-slide-up">
          <h2 class="text-xl sm:text-3xl font-bold text-gray-800 tracking-tight mb-6 text-center">
            {{ loginType === 'admin' ? 'Admin Login' : loginType === 'staff' ? 'Staff Login' : 'Student Login' }}
          </h2>
          <form @submit.prevent="login" class="space-y-6">
            <div>
              <input 
                v-model="username" 
                :placeholder="loginType === 'student' ? 'Register No' : 'Username'" 
                required 
                class="w-full bg-gray-50 border border-gray-300 p-3 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-150 text-sm sm:text-base" 
              />
            </div>
            <div class="relative">
              <input 
                v-model="password" 
                :type="showPassword ? 'text' : 'password'"
                placeholder="Password" 
                required 
                class="w-full bg-gray-50 border border-gray-300 p-3 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-150 text-sm sm:text-base pr-10"
              />
              <button 
                type="button"
                @click="togglePasswordVisibility"
                class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
              >
                <svg v-if="!showPassword" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.79m0 0L21 21" />
                </svg>
              </button>
            </div>
            <button 
              type="submit" 
              class="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-all duration-200 shadow-md font-semibold tracking-wide text-sm sm:text-base"
              :disabled="isLoading"
            >
              {{ isLoading ? 'Logging in...' : 'Login' }}
            </button>
          </form>
          <div class="mt-4 text-center space-y-2">
            <button 
              @click="loginType = 'admin'" 
              class="w-full text-indigo-600 hover:text-indigo-600 transition-colors duration-150 text-xs sm:text-sm font-medium"
              :class="{ 'underline': loginType === 'admin' }"
              :disabled="isLoading"
            >
              Admin Login
            </button>
            <button 
              @click="loginType = 'staff'" 
              class="w-full text-indigo-600 hover:text-indigo-600 transition-colors duration-150 text-xs sm:text-sm font-medium"
              :class="{ 'underline': loginType === 'staff' }"
              :disabled="isLoading"
            >
              Staff Login
            </button>
            <button 
              @click="loginType = 'student'" 
              class="w-full text-indigo-600 hover:text-indigo-600 transition-colors duration-150 text-xs sm:text-sm font-medium"
              :class="{ 'underline': loginType === 'student' }"
              :disabled="isLoading"
            >
              Student Login
            </button>
          </div>
          <!-- <p v-if="error" class="mt-4 text-center text-red-500 font-medium animate-pulse text-xs sm:text-sm">
             {{ error }}
          </p> -->
        </div>
      </div>

      <!-- Loading Modal -->
      <div v-if="isLoading" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center space-y-4">
          <img src="@/images/loading.gif" alt="Loading" class="w-22 h-22" />
          <p class="text-gray-800 font-semibold text-sm sm:text-base">
            Logging in, Sit back and relax!
          </p>
        </div>
      </div>

      <!-- Apply for Exam Cards -->
      <div v-if="openCourses.length" class="mt-12 w-full max-w-6xl">
        <h3 class="text-xl font-semibold text-gray-800 mb-4 text-center animate-bounce-arrow">
          Available Courses for Enrollment
          <span class="inline-block ml-2 animate-bounce">↓</span>
        </h3>
        <div class="max-h-96 overflow-y-auto scroll-smooth">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
            <div v-for="course in openCourses" :key="course.id" 
                 class="bg-white p-6 rounded-xl shadow-lg border border-gray-200 transform transition-all duration-500 hover:scale-105 hover:shadow-2xl animate-card-pop">
              <div class="flex items-center space-x-4">
                <AcademicCapIcon class="w-10 h-10 text-indigo-600 animate-bounce-slow" />
                <div>
                  <h4 class="text-lg font-bold text-gray-800">{{ course.name }}</h4>
                  <p class="text-sm text-gray-600">{{ course.description }}</p>
                </div>
              </div>
              <div class="mt-4 space-y-2">
                <p class="text-sm text-gray-700"><strong>Exam Date:</strong> {{ course.examDate || 'TBA' }}</p>
                <p class="text-sm text-gray-700"><strong>Exam Time:</strong> {{ course.examTime || 'TBA' }} IST</p>
              </div>
              <button @click="goToEnrollment(course.id)" 
                      class="mt-4 w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-all duration-200 flex items-center justify-center space-x-2">
                <CheckCircleIcon class="w-5 h-5" />
                <span>Apply Now</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer (Fixed at Bottom) -->
    <footer class="py-4 px-4 sm:px-6 lg:px-8 bg-gray-50 text-center text-gray-600 text-xs sm:text-sm shadow-inner">
      <p>Developed by <span class="font-semibold"><a href="https://www.pmu.edu" target="_blank">VISTA</a></span> | © 2025 Department Of Informatics</p>
    </footer>
  </div>
</template>

<script>
import axios from 'axios';
import { AcademicCapIcon, CheckCircleIcon } from '@heroicons/vue/24/solid';

export default {
  components: { AcademicCapIcon, CheckCircleIcon },
  data() {
    return {
      username: '',
      password: '',
      error: '',
      loginType: 'student',
      showPassword: false,
      openCourses: [],
      isLoading: false,
    };
  },
  methods: {
    async login() {
      this.isLoading = true;
      this.error = '';
      try {
        // Clear any existing session data before login
        localStorage.removeItem('user');
        console.log('Cleared localStorage before login attempt');

        const payload = {
          role: this.loginType,
          [this.loginType === 'student' ? 'registerNo' : 'username']: this.username,
          password: this.password,
        };

        console.log('Sending login request:', {
          url: '/api/login',
          payload,
        });

        const { data } = await axios.post('/api/login', payload, { withCredentials: true });

        console.log('Login response:', data);

        if (!data || !data.id) {
          throw new Error('Invalid user data received from server');
        }

        if (this.loginType === 'admin' && !data.isMaster) {
          console.log('Admin is not a master admin:', data);
          this.error = 'Only master admins can log in';
          this.isLoading = false;
          return;
        }

        const user = { role: this.loginType, ...data };
        localStorage.setItem('user', JSON.stringify(user));
        console.log('User stored in localStorage:', JSON.parse(localStorage.getItem('user')));

        if (this.loginType === 'admin') {
          this.$emit('login-success', user);
        } else if (this.loginType === 'staff') {
          this.$emit('staff-login', user);
        } else {
          this.$emit('student-login', user);
        }

        this.error = '';
      } catch (err) {
        console.error('Login error:', {
          message: err.message,
          response: err.response ? {
            status: err.response.status,
            data: err.response.data,
          } : null,
        });
        this.error = err.response?.data?.error || 'Failed to log in. Please check your credentials and try again.';
      } finally {
        this.isLoading = false;
      }
    },
    togglePasswordVisibility() {
      this.showPassword = !this.showPassword;
    },
    goToPMU() {
      window.location.href = 'https://pmu.edu';
    },
    async fetchOpenCourses() {
      try {
        const { data } = await axios.get('/api/public-enrollment');
        console.log('Fetched courses:', data);
        this.openCourses = data.filter(course => course.isRegistrationOpen);
        console.log('Filtered open courses:', this.openCourses);
      } catch (err) {
        console.error('Error fetching open courses:', err.response ? err.response.status : err.message);
        this.error = 'Failed to load courses. Check server connection.';
      }
    },
    goToEnrollment(courseId) {
      console.log('Navigating to enrollment for courseId:', courseId);
      console.log('Current user before navigation:', JSON.parse(localStorage.getItem('user')) || 'No user');
      this.$router.push({ name: 'Enrollment', params: { courseId } });
    },
  },
  created() {
    // Clear localStorage on component creation to ensure clean state
    localStorage.removeItem('user');
    console.log('Cleared localStorage on Login.vue creation');
    this.fetchOpenCourses();
  },
  directives: {
    'no-right-click': {
      mounted(el) {
        el.addEventListener('contextmenu', (e) => {
          e.preventDefault();
        });
      },
    },
  },
};
</script>

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
@keyframes cardPop {
  0% { transform: scale(0.9); opacity: 0; }
  50% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes bounceSlow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}
@keyframes bounceArrow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(5px); }
}
.animate-fade-in {
  animation: fadeIn 1s ease-out;
}
.animate-slide-up {
  animation: slideUp 0.8s ease-out;
}
.animate-card-pop {
  animation: cardPop 0.6s ease-out;
}
.animate-bounce-slow {
  animation: bounceSlow 2s infinite ease-in-out;
}
.animate-bounce-arrow {
  display: inline-flex;
  align-items: center;
}
.animate-bounce-arrow span {
  animation: bounceArrow 1.5s infinite ease-in-out;
}
.h-screen {
  height: 100vh;
}
.overflow-hidden {
  overflow: hidden;
}
.overflow-y-auto {
  overflow-y: auto;
}
.scroll-smooth {
  scroll-behavior: smooth;
}
.max-h-96 {
  max-height: 24rem;
}
@media (min-width: 1024px) {
  .max-w-6xl {
    max-width: 72rem;
  }
  .pt-28 {
    padding-top: 7rem;
  }
  .md\\:flex-row {
    flex-direction: row;
  }
  .md\\:w-1\\2 {
    width: 50%;
  }
}
@media (max-width: 768px) {
  .md\\:flex-row {
    flex-direction: column;
  }
  .md\\:w-1\\2 {
    width: 100%;
  }
  .max-w-6xl {
    max-width: 100%;
  }
  .pt-20 {
    padding-top: 5rem;
  }
}
.relative {
  position: relative;
}
.pr-10 {
  padding-right: 2.5rem;
}
</style>

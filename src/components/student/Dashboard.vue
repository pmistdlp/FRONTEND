<template>
  <div class="flex h-screen bg-white text-gray-800 font-sans antialiased">
    <div v-if="!isExamActive" class="w-64 bg-white shadow-md flex flex-col border-r border-gray-200">
      <div class="p-6">
        <h1 class="text-2xl font-bold text-indigo-600">Student Dashboard</h1>
      </div>
      <nav class="flex-1">
        <button
          @click="activeSection = 'courses'"
          :class="[
            'w-full text-left px-6 py-3 flex items-center space-x-3',
            activeSection === 'courses' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'
          ]"
        >
          <AcademicCapIcon class="w-5 h-5" />
          <span>Courses</span>
        </button>
        <button
          @click="activeSection = 'profile'"
          :class="[
            'w-full text-left px-6 py-3 flex items-center space-x-3',
            activeSection === 'profile' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'
          ]"
        >
          <img
            v-if="profilePhoto"
            :src="profilePhoto"
            alt="Profile Photo"
            class="w-5 h-5 rounded-full object-cover"
            @error="handleImageError"
          >
          <UserIcon v-else class="w-5 h-5" />
          <span>Profile</span>
        </button>
      </nav>
      <div class="p-6">
        <button
          @click="showLogoutModal"
          :disabled="isExamActive"
          class="w-full bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-all duration-200 flex items-center justify-center disabled:bg-red-300 disabled:cursor-not-allowed"
        >
          <ArrowLeftOnRectangleIcon class="w-5 h-5 mr-2" />
          Logout
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto" :class="{ 'p-6 md:p-10': !isExamActive, 'p-0': isExamActive }">
      <div v-if="isLoading && !isExamActive" class="bg-white p-6 rounded-lg shadow-md border border-gray-200 text-center">
        <p class="text-gray-600">Loading...</p>
      </div>
      <div v-else-if="errorMessage && !isExamActive" class="bg-red-50 p-6 rounded-lg shadow-md border border-red-200">
        <p class="text-red-600">{{ errorMessage }}</p>
      </div>
      <Courses
        v-else-if="activeSection === 'courses'"
        v-model:courses="courses"
        :is-exam-active="isExamActive"
        :user="updatedUser"
        @exam-status-changed="updateExamStatus"
        @toggle-dashboard="toggleDashboard"
        @logout="handleLogout"
      />
      <Profile
        v-else-if="activeSection === 'profile' && !isExamActive"
        :user="updatedUser"
        @logout="handleLogout"
        @profile-updated="handleProfileUpdate"
      />
    </div>

    <div v-if="showLogoutModalFlag" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center space-y-4 max-w-sm w-full">
        <ExclamationTriangleIcon class="w-12 h-12 text-yellow-500" />
        <p class="text-gray-800 font-semibold text-center text-base">
          Are you sure you want to logout?
        </p>
        <div class="flex space-x-4 w-full">
          <button 
            @click="confirmLogout" 
            class="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all duration-200 font-medium"
          >
            Yes
          </button>
          <button 
            @click="showLogoutModalFlag = false" 
            class="flex-1 bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition-all duration-200 font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import apiConfig from '@/config/apiConfig';
import Courses from './Courses.vue';
import Profile from './Profile.vue';
import { AcademicCapIcon, ArrowLeftOnRectangleIcon, ExclamationTriangleIcon, UserIcon } from '@heroicons/vue/24/solid';

export default {
  components: { 
    Courses,
    Profile,
    AcademicCapIcon, 
    ArrowLeftOnRectangleIcon, 
    ExclamationTriangleIcon,
    UserIcon 
  },
  props: {
    user: {
      type: Object,
      default: () => ({ id: undefined }),
    },
  },
  data() {
    return {
      activeSection: 'courses',
      courses: [],
      isLoading: false,
      errorMessage: '',
      isExamActive: false,
      showLogoutModalFlag: false,
      profilePhoto: null,
      baseUrl: '',
      updatedUser: null,
    };
  },
  methods: {
    async fetchUserDetails() {
      try {
        if (!this.user || !this.user.id) {
          throw new Error('User ID is missing');
        }
        const baseURL = await apiConfig.getBaseURL();
        console.log(`[${new Date().toISOString()}] Fetching complete details from: ${baseURL}/api/student-courses/complete-details/${this.user.id}`);
        const response = await axios.get(`${baseURL}/api/student-courses/complete-details/${this.user.id}`, { withCredentials: true });
        const { student, courses } = response.data;
        console.log('Received complete details:', { student, courses });

        this.updatedUser = {
          id: student.id,
          name: student.name || 'Student',
          registerNo: student.registerNo || `STU${student.id}`, // Fallback only if null
          abcId: student.abcId || 'N/A', // Fallback only if null
          role: 'student'
        };
        this.profilePhoto = student.photo ? `${baseURL}${student.photo}` : null; // Prepend baseURL for photo
        this.courses = courses || [];
        console.log('Updated user:', this.updatedUser);
        console.log('Updated courses:', this.courses);

        if (this.courses.length === 0) {
          this.errorMessage = 'No courses assigned to you. Please contact the administrator.';
        }
      } catch (error) {
        console.error('Error fetching complete details:', error.response ? error.response.data : error.message);
        this.errorMessage = `Failed to fetch student details and courses: ${error.response ? error.response.data.error : error.message}`;
        this.updatedUser = {
          ...this.user,
          registerNo: this.user.id ? `STU${this.user.id}` : '',
          name: this.user.name || 'Student',
          abcId: 'N/A',
          role: 'student'
        };
        this.courses = [];
      }
    },
    async validateSession() {
      try {
        const baseURL = await apiConfig.getBaseURL();
        console.log(`[${new Date().toISOString()}] Validating session at: ${baseURL}/api/check-session`);
        const response = await axios.get(`${baseURL}/api/check-session`, { withCredentials: true });
        console.log('Session validation response:', response.data);
        return response.data.isAuthenticated && response.data.user.role === 'student' ? response.data.user : null;
      } catch (error) {
        console.error('Session validation failed:', error.response ? error.response.data : error.message);
        return null;
      }
    },
    handleProfileUpdate(updatedProfile) {
      this.profilePhoto = updatedProfile.photo ? `${this.baseUrl}${updatedProfile.photo}` : null;
      console.log('Profile updated, photo set to:', this.profilePhoto);
      if (updatedProfile.registerNo) {
        this.updatedUser.registerNo = updatedProfile.registerNo;
      }
      if (updatedProfile.name) {
        this.updatedUser.name = updatedProfile.name;
      }
    },
    handleImageError() {
      console.error('Failed to load profile photo in sidebar');
      this.profilePhoto = null;
    },
    updateExamStatus(isActive) {
      this.isExamActive = isActive;
      console.log('Exam status updated:', this.isExamActive);
    },
    toggleDashboard(isExamActive) {
      this.isExamActive = isExamActive;
      console.log('Dashboard visibility toggled, isExamActive:', this.isExamActive);
    },
    showLogoutModal() {
      this.showLogoutModalFlag = true;
    },
    async confirmLogout() {
      this.showLogoutModalFlag = false;
      await this.handleLogout();
    },
    async handleLogout() {
      try {
        const baseURL = await apiConfig.getBaseURL();
        console.log(`[${new Date().toISOString()}] Attempting logout via: ${baseURL}/api/logout`);
        const response = await axios.post(`${baseURL}/api/logout`, {}, { withCredentials: true });
        console.log('Logout response:', response.data);
        localStorage.removeItem('user');
        this.courses = [];
        this.profilePhoto = null;
        this.isExamActive = false;
        this.updatedUser = null;
        this.$emit('logout');
        this.$router.push('/');
      } catch (error) {
        console.error('Error during logout:', error.response?.data || error.message);
        console.error(`[${new Date().toISOString()}] Failed to logout: ${error.response?.data?.error || error.message}`);
      }
    },
  },
  async created() {
    console.log('Dashboard created, user:', this.user);
    if (!this.user || !this.user.id) {
      console.error('User data incomplete:', this.user);
      this.errorMessage = 'Please log in to access your dashboard.';
      this.$router.push('/');
      return;
    }
    this.isLoading = true;
    try {
      const baseURL = await apiConfig.getBaseURL();
      this.baseUrl = baseURL;
      const sessionUser = await this.validateSession();
      if (!sessionUser || sessionUser.id !== this.user.id) {
        console.error('Session is invalid or user ID mismatch. Session user:', sessionUser, 'Prop user:', this.user);
        this.errorMessage = 'Session expired or invalid. Please log in again.';
        await this.handleLogout();
        return;
      }
      await this.fetchUserDetails();
    } catch (error) {
      console.error('Error during dashboard initialization:', error);
      this.errorMessage = 'Failed to initialize dashboard. Please try again.';
    } finally {
      this.isLoading = false;
    }
  },
};
</script>

<style scoped>
.font-sans {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}
.transition-all {
  transition: all 0.2s ease-in-out;
}
button:hover {
  transform: translateY(-1px);
}
@media (max-width: 768px) {
  .p-6 {
    padding: 1rem;
  }
  .md\:p-10 {
    padding: 1.5rem;
  }
}
</style>
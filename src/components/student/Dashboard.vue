<template>
  <div class="flex h-screen bg-white text-gray-800 font-sans antialiased border-r border-gray-200">
    <!-- Sidebar -->
    <div class="w-64 bg-white shadow-md flex flex-col border-r border-gray-200">
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

    <!-- Main Content -->
    <div class="flex-1 p-6 md:p-10 overflow-y-auto">
      <!-- Loading State -->
      <div v-if="isLoading" class="bg-white p-6 rounded-lg shadow-md border border-gray-200 text-center">
        <p class="text-gray-600">Loading...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="errorMessage" class="bg-red-50 p-6 rounded-lg shadow-md border border-red-200">
        <p class="text-red-600">{{ errorMessage }}</p>
      </div>

      <!-- Courses -->
      <Courses
        v-else-if="activeSection === 'courses'"
        :courses="courses"
        :is-exam-active="isExamActive"
        :user="user"
        @start-exam="handleStartExam"
        @show-message="showModal"
        @exam-status-changed="updateExamStatus"
      />

      <!-- Profile -->
      <Profile
        v-else-if="activeSection === 'profile'"
        :user="user"
        @logout="handleLogout"
        @profile-updated="handleProfileUpdate"
      />
    </div>

    <!-- Message Modal -->
    <div v-if="showMessageModal" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-xl shadow-lg border border-gray-200 max-w-md w-full text-gray-800">
        <h3 class="text-xl font-semibold text-red-600 mb-4 flex items-center">
          <ExclamationCircleIcon class="w-6 h-6 mr-2 text-red-500" /> Information
        </h3>
        <p class="text-gray-700">{{ modalMessage }}</p>
        <div v-if="examLink" class="mt-4">
          <a
            :href="examLink"
            class="bg-green-500 text-white px-6 py-2 rounded-full hover:bg-green-600 transition-all duration-200 flex items-center mx-auto"
            @click.prevent="navigateToExam"
          >
            <PlayIcon class="w-5 h-5 mr-2" /> Go to Exam Page
          </a>
        </div>
        <button
          @click="closeModal"
          :disabled="isExamActive"
          class="mt-4 bg-indigo-500 text-white px-6 py-2 rounded-full hover:bg-indigo-600 transition-all duration-200 flex items-center mx-auto disabled:bg-indigo-300 disabled:cursor-not-allowed"
        >
          <CheckIcon class="w-5 h-5 mr-2" /> Okay
        </button>
      </div>
    </div>

    <!-- Logout Confirmation Modal -->
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
import { AcademicCapIcon, ArrowLeftOnRectangleIcon, ExclamationCircleIcon, CheckIcon, PlayIcon, ExclamationTriangleIcon, UserIcon } from '@heroicons/vue/24/solid';

export default {
  components: { 
    Courses,
    Profile,
    AcademicCapIcon, 
    ArrowLeftOnRectangleIcon, 
    ExclamationCircleIcon, 
    CheckIcon, 
    PlayIcon, 
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
      showMessageModal: false,
      modalMessage: '',
      examLink: null,
      isExamActive: false,
      showLogoutModalFlag: false,
      profilePhoto: null,
      baseUrl: '',
    };
  },
  methods: {
    async fetchCourses() {
      this.isLoading = true;
      this.errorMessage = '';
      try {
        if (!this.user || !this.user.id) {
          console.error('User ID is undefined or missing:', this.user);
          throw new Error('Please log in to view your courses.');
        }
        console.log(`Fetching courses for student ID: ${this.user.id}`);
        const baseURL = await apiConfig.getBaseURL();
        const response = await axios.get(`${baseURL}/api/student-courses/${this.user.id}`);
        console.log('Courses fetched:', response.data);
        this.courses = response.data || [];
      } catch (error) {
        console.error('Error fetching courses:', error.response ? error.response.data : error.message);
        this.errorMessage = `Failed to fetch courses: ${error.response ? error.response.data.error : error.message}`;
      } finally {
        this.isLoading = false;
      }
    },
    async fetchProfile() {
      try {
        if (!this.user || !this.user.registerNo) {
          throw new Error('No register number provided in user data.');
        }
        const registerNo = this.user.registerNo;
        const url = `/api/student-profile/profile/${registerNo}`;
        console.log('Fetching profile from:', `${this.baseUrl}${url}`);

        const response = await axios.get(url, { withCredentials: true });
        const data = response.data;

        if (!data || typeof data !== 'object') {
          throw new Error('Invalid profile data received from server');
        }

        this.profilePhoto = data.photo ? `${this.baseUrl}${data.photo}` : null;
        console.log('Profile photo set to:', this.profilePhoto);
      } catch (error) {
        console.error('Error fetching profile in Dashboard:', error.response ? error.response.data : error.message);
        this.errorMessage = `Failed to fetch profile: ${error.response ? error.response.data.error || error.message : error.message}`;
        this.profilePhoto = null;
      }
    },
    async updateBaseUrl() {
      try {
        const response = await axios.get('/api/config/base-url');
        this.baseUrl = response.data.baseURL;
        console.log('Base URL set to:', this.baseUrl);
      } catch (error) {
        console.error('Error fetching base URL:', error);
        this.baseUrl = 'http://localhost:3000';
        console.log('Using fallback base URL:', this.baseUrl);
      }
    },
    handleProfileUpdate(updatedProfile) {
      this.profilePhoto = updatedProfile.photo ? `${this.baseUrl}${updatedProfile.photo}` : null;
      console.log('Profile updated, photo set to:', this.profilePhoto);
    },
    handleImageError() {
      console.error('Failed to load profile photo in sidebar');
      this.profilePhoto = null;
    },
    showModal(message, examLink = null) {
      this.modalMessage = message;
      this.examLink = examLink;
      this.showMessageModal = true;
    },
    closeModal() {
      if (this.isExamActive) return;
      this.showMessageModal = false;
      this.examLink = null;
    },
    navigateToExam() {
      if (this.examLink) {
        console.log('Performing direct navigation to:', this.examLink);
        window.location.href = this.examLink;
      }
    },
    handleStartExam(course) {
      const examPath = `/exam/${course.id}/${encodeURIComponent(course.name)}`;
      console.log('Attempting to navigate to Exam with path:', examPath);
      this.$router.push(examPath)
        .catch(err => {
          console.error('Navigation error:', err.message);
          this.showModal(
            'Failed to navigate to the exam page automatically. Click the link below to proceed.',
            examPath
          );
        });
    },
    updateExamStatus(isActive) {
      this.isExamActive = isActive;
      console.log('Exam status updated:', this.isExamActive);
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
        // Call backend logout endpoint to clear server-side session
        const response = await axios.post('/api/logout', {}, { withCredentials: true });
        console.log('Logout response:', response.data);
        // Clear local storage and session data
        localStorage.removeItem('user');
        this.courses = [];
        this.profilePhoto = null;
        this.isExamActive = false;
        this.$emit('logout');
        this.$router.push('/');
      } catch (error) {
        console.error('Error during logout:', error.response?.data || error.message);
        let errorMessage = 'Failed to logout. Please try again.';
        if (error.response?.status === 404) {
          errorMessage = 'Logout endpoint not found. Please contact support.';
        } else if (error.response?.data?.error) {
          errorMessage = `Failed to logout: ${error.response.data.error}`;
        }
        this.showModal(errorMessage);
      }
    },
  },
  async created() {
    await this.updateBaseUrl();
    console.log('User:', this.user);
    if (!this.user || !this.user.id) {
      console.error('User data incomplete:', this.user);
      this.errorMessage = 'Please log in to access your dashboard.';
    } else {
      await this.fetchCourses();
      await this.fetchProfile();
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
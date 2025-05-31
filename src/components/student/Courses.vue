<template>
  <div class="space-y-6 p-4 bg-blue-50 text-indigo-600 relative h-screen" ref="container">
    <!-- Course List View -->
    <div>
      <h2 class="text-2xl font-bold transition-all duration-300 hover:text-indigo-600 pb-4">My Courses</h2>
      <div v-if="isLoading || isCheckingSession" class="bg-white p-6 rounded-lg shadow-md border border-gray-200 text-center">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-t-4 border-indigo-500 border-solid"></div>
        <p class="text-gray-600 text-sm mt-2">Loading courses...</p>
      </div>
      <div v-else-if="errorMessage" class="bg-red-50 p-6 rounded-lg shadow-md border border-red-200 text-center">
        <p class="text-red-600 text-sm">{{ errorMessage }}</p>
      </div>
      <div v-else-if="!courses.length" class="bg-white p-6 rounded-lg shadow-md border border-gray-200 text-center">
        <p class="text-gray-600 text-sm">No courses assigned. Please contact the administrator.</p>
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="course in courses"
          :key="course.id"
          class="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-all duration-200"
        >
          <div class="flex items-center mb-4">
            <AcademicCapIcon class="w-8 h-8 text-indigo-500 mr-3" />
            <h3 class="text-lg font-semibold text-indigo-600">{{ course.name }}</h3>
          </div>
          <div class="space-y-2 text-sm text-gray-700">
            <p><span class="font-medium">Course Code:</span> {{ course.courseCode }}</p>
            <p><span class="font-medium">Platform:</span> {{ course.learningPlatform }}</p>
            <p><span class="font-medium">Exam Date:</span> {{ course.examDate }}</p>
            <p><span class="font-medium">Exam Time:</span> {{ course.examTime }} IST</p>
            <p><span class="font-medium">Eligible:</span> {{ course.isEligible ? 'Yes' : 'No' }}</p>
            <p><span class="font-medium">Payment:</span> {{ course.paymentConfirmed ? 'Confirmed' : 'Pending' }}</p>
            <p><span class="font-medium">Status:</span>
              <span
                :class="{
                  'text-red-600': course.hasCompleted || course.hasMalpractice || course.hasExited,
                }"
              >
                {{ course.hasMalpractice ? 'Auto Evaluated' : course.hasExited ? 'Exited' : course.hasCompleted ? 'Completed' : 'Not Started' }}
              </span>
            </p>
          </div>
          <div class="mt-4 flex flex-col space-y-2">
            <button
              @click="startExam(course)"
              :disabled="!course.isEligible || !course.paymentConfirmed || course.hasCompleted || course.hasMalpractice || course.hasExited"
              class="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-all duration-200 flex items-center justify-center space-x-1 text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
              :title="getStartExamTooltip(course)"
            >
              <PlayIcon class="w-4 h-4" />
              <span>Start Exam</span>
            </button>
            <button
              @click="downloadHallTicket(course.id)"
              :disabled="!course.isEligible || !course.paymentConfirmed || isDownloading"
              class="bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-600 transition-all duration-200 text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
              :title="getHallTicketTooltip(course)"
            >
              {{ isDownloading ? 'Downloading...' : 'Download Hall Ticket' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { AcademicCapIcon, PlayIcon } from '@heroicons/vue/24/solid';
import { useCourses } from '@/components/student/composables/courses';
import { useHallTicketFeatures } from '@/components/student/composables/hallTicketFeatures';
import { ref, onMounted } from 'vue';
import axios from 'axios';
import apiConfig from '@/config/apiConfig';

export default {
  components: { AcademicCapIcon, PlayIcon },
  props: {
    user: {
      type: Object,
      default: () => ({}),
    },
  },
  setup(props, { emit }) {
    const { courses, student, isLoading, errorMessage, fetchCourses } = useCourses();
    const studentId = ref(props.user?.id || null);
    const { isDownloading, downloadHallTicketForStudent } = useHallTicketFeatures(studentId, emit);
    const isCheckingSession = ref(true);

    // Function to check session and get user data
    const checkSession = async () => {
      try {
        const baseURL = await apiConfig.getBaseURL();
        console.log(`[${new Date().toISOString()}] [Courses.vue] Checking session at ${baseURL}/api/check-session`);
        const response = await axios.get(`${baseURL}/api/check-session`, { withCredentials: true });
        console.log(`[${new Date().toISOString()}] [Courses.vue] Session check response:`, response.data);

        if (response.data.isAuthenticated && response.data.user.role === 'student') {
          return response.data.user;
        } else {
          throw new Error('Invalid session or not a student');
        }
      } catch (error) {
        console.error(`[${new Date().toISOString()}] [Courses.vue] Session check failed:`, error.response?.data || error.message);
        return null;
      }
    };

    // Function to fetch courses
    const initializeCourses = async () => {
      isCheckingSession.value = true;
      let fetchedStudentId = studentId.value;

      // If no student ID from props, check session
      if (!fetchedStudentId) {
        const sessionUser = await checkSession();
        fetchedStudentId = sessionUser?.id;
        studentId.value = fetchedStudentId;
      }

      if (fetchedStudentId) {
        console.log(`[${new Date().toISOString()}] [Courses.vue] Initializing courses for studentId: ${fetchedStudentId}`);
        await fetchCourses(fetchedStudentId);
        console.log(`[${new Date().toISOString()}] [Courses.vue] Fetched student data:`, student.value);
        console.log(`[${new Date().toISOString()}] [Courses.vue] Fetched courses:`, courses.value);
      } else {
        errorMessage.value = 'Unable to authenticate. Please log in again.';
        console.error(`[${new Date().toISOString()}] [Courses.vue] No student ID available`);
        emit('logout'); // Trigger logout if no student ID
      }
      isCheckingSession.value = false;
    };

    // Placeholder for start exam functionality
    const startExam = (course) => {
      console.log(`[${new Date().toISOString()}] [Courses.vue] Start Exam clicked for course:`, course.id, course.name);
      emit('show-message', {
        message: 'Start Exam functionality will be implemented soon.',
        type: 'info',
      });
    };

    // Download hall ticket
    const downloadHallTicket = async (courseId) => {
      console.log(`[${new Date().toISOString()}] [Courses.vue] Download Hall Ticket clicked for courseId: ${courseId}, studentId: ${studentId.value}`);
      if (!studentId.value) {
        console.error(`[${new Date().toISOString()}] [Courses.vue] Student ID is missing`);
        emit('show-message', {
          message: 'Unable to download hall ticket: Please log in again.',
          type: 'error',
        });
        emit('logout');
        return;
      }
      await downloadHallTicketForStudent(courseId);
    };

    // Tooltips for buttons
    const getStartExamTooltip = (course) => {
      if (!course.isEligible) return 'You are not eligible to take this exam';
      if (!course.paymentConfirmed) return 'Payment is not confirmed';
      if (course.hasCompleted) return 'Exam already completed';
      if (course.hasMalpractice) return 'Exam auto-evaluated due to malpractice';
      if (course.hasExited) return 'Exam already exited';
      return 'Start the exam';
    };

    const getHallTicketTooltip = (course) => {
      if (!course.isEligible) return 'You are not eligible to download the hall ticket';
      if (!course.paymentConfirmed) return 'Payment is not confirmed';
      if (isDownloading.value) return 'Hall ticket is downloading';
      return 'Download your hall ticket';
    };

    onMounted(() => {
      console.log(`[${new Date().toISOString()}] [Courses.vue] Component mounted, user prop:`, props.user);
      initializeCourses();
    });

    return {
      courses,
      student,
      isLoading,
      errorMessage,
      isCheckingSession,
      isDownloading,
      startExam,
      downloadHallTicket,
      getStartExamTooltip,
      getHallTicketTooltip,
    };
  },
};
</script>

<style scoped>
@font-face {
  font-family: 'Poppins';
  font-style: normal;
  font-weight: 400;
  src: local('Poppins Regular'), local('Poppins-Regular'), url(https://fonts.gstatic.com/s/poppins/v15/pxiEyp8kv8JHgFVrJJfedw.ttf) format('truetype');
}
@font-face {
  font-family: 'Poppins';
  font-style: normal;
  font-weight: 500;
  src: local('Poppins Medium'), local('Poppins-Medium'), url(https://fonts.gstatic.com/s/poppins/v15/pxiByp8kv8JHgFVrLGT9Z1xlEA.ttf) format('truetype');
}
@font-face {
  font-family: 'Poppins';
  font-style: normal;
  font-weight: 600;
  src: local('Poppins SemiBold'), local('Poppins-SemiBold'), url(https://fonts.gstatic.com/s/poppins/v15/pxiByp8kv8JHgFVrLEj6Z1xlEA.ttf) format('truetype');
}

.space-y-6 { --space-y: 1.5rem; }
.space-y-4 { --space-y: 1rem; }
.space-y-3 { --space-y: 0.75rem; }
.space-y-2 { --space-y: 0.5rem; }
.space-x-4 { --space-x: 1rem; }
.space-x-2 { --space-x: 0.5rem; }

.space-y-6 > * + *, .space-y-4 > * + *, .space-y-3 > * + *, .space-y-2 > * + * {
  margin-top: var(--space-y);
}
.space-x-4 > * + *, .space-x-2 > * + * {
  margin-left: var(--space-x);
}

.transition-all { transition: all 0.2s ease; }

@media (max-width: 1024px) {
  .lg\:flex-row { flex-direction: column; }
  .lg\:space-x-4 { --space-x: 0; --space-y: 1rem; }
  .lg\:flex-1 { width: 100%; }
  .lg\:w-48 { width: 100%; }
  .lg\:mb-0 { margin-bottom: 1rem; }
}

@media (max-width: 640px) {
  .p-4 { padding: 0.75rem; }
  .text-2xl { font-size: 1.25rem; }
  .text-base { font-size: 0.875rem; }
  .text-sm { font-size: 0.75rem; }
  .text-xs { font-size: 0.625rem; }
  .w-10 { width: 2.5rem; }
  .h-10 { height: 2.5rem; }
  .w-8 { width: 1.75rem; }
  .h-8 { height: 1.75rem; }
  .w-6 { width: 1.25rem; }
  .h-6 { height: 1.25rem; }
  .px-3 { padding-left: 0.5rem; padding-right: 0.5rem; }
  .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
  .max-w-md { width: 90%; }
}
</style>
<template>
  <div class="space-y-6 p-4 bg-white text-gray-800">
    <!-- Loading Overlay -->
    <div v-if="isLoading || isCheckingSession" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
      <div class="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-500 border-solid"></div>
      <p class="text-white ml-4">Loading...</p>
    </div>

    <h2 class="text-2xl font-bold transition-all duration-300 hover:text-indigo-600">My Courses</h2>

    <!-- Course List -->
    <div class="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200 max-h-[400px] overflow-y-auto scrollbar-hidden">
      <h3 class="text-base font-semibold text-indigo-500 mb-4">Course List</h3>
      <div v-if="isLoading || isCheckingSession" class="text-center text-gray-500">Loading courses...</div>
      <div v-else-if="errorMessage" class="bg-red-50 p-6 rounded-lg shadow-md border border-red-200 text-center">
        <p class="text-red-600 text-sm">{{ errorMessage }}</p>
      </div>
      <div v-else-if="!courses.length" class="text-center text-gray-500">No courses assigned. Please contact the administrator.</div>
      <table v-else class="min-w-full bg-white border border-gray-200 rounded-md text-sm">
        <thead class="sticky top-0 bg-gray-100">
          <tr>
            <th class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">Course Name</th>
            <th class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">Course Code</th>
            <th class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">Platform</th>
            <th class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">Exam Date</th>
            <th class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">Exam Time</th>
            <th class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">Status</th>
            <th class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="course in courses" :key="course.id" class="hover:bg-gray-50 transition-all duration-200">
            <td class="py-2 px-3 border-b border-gray-200">{{ course.name }}</td>
            <td class="py-2 px-3 border-b border-gray-200">{{ course.courseCode || 'N/A' }}</td>
            <td class="py-2 px-3 border-b border-gray-200">{{ course.learningPlatform || 'N/A' }}</td>
            <td class="py-2 px-3 border-b border-gray-200">{{ course.examDate || 'N/A' }}</td>
            <td class="py-2 px-3 border-b border-gray-200">{{ course.examTime ? `${course.examTime} IST` : 'N/A' }}</td>
            <td class="py-2 px-3 border-b border-gray-200">
              <span
                :class="{
                  'text-red-600': course.hasCompleted || course.hasMalpractice || course.hasExited,
                }"
              >
                {{ course.hasMalpractice ? 'Auto Evaluated' : course.hasExited ? 'Exited' : course.hasCompleted ? 'Completed' : 'Not Started' }}
              </span>
            </td>
            <td class="py-2 px-3 border-b border-gray-200 flex flex-wrap gap-2">
              <button
                @click="handleStartExam(course)"
                :disabled="!course.isEligible || !course.paymentConfirmed || course.hasCompleted || course.hasMalpractice || course.hasExited || isExamLoading"
                class="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600 transition-all duration-200 flex items-center space-x-1 text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
                :title="getStartExamTooltip(course)"
              >
                <PlayIcon class="w-4 h-4" />
                <span>{{ isExamLoading ? 'Starting...' : 'Start Exam' }}</span>
              </button>
              <button
                @click="downloadHallTicket(course.id)"
                :disabled="!course.isEligible || !course.paymentConfirmed || isDownloading"
                class="bg-indigo-500 text-white px-3 py-1 rounded-md hover:bg-indigo-600 transition-all duration-200 flex items-center space-x-1 text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
                :title="getHallTicketTooltip(course)"
              >
                <DownloadIcon class="w-4 h-4" />
                <span>{{ isDownloading ? 'Downloading...' : 'Download Hall Ticket' }}</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Exam Modal -->
    <div v-if="showExamModal" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-xl shadow-lg border border-gray-200 max-w-md w-full text-gray-800">
        <h3 class="text-xl font-semibold text-indigo-600 mb-4 flex items-center">
          <ExclamationCircleIcon class="w-6 h-6 mr-2 text-indigo-500" /> Information
        </h3>
        <p class="text-gray-700">{{ examErrorMessage || 'Exam Not Yet Started' }}</p>
        <button
          @click="closeExamModal"
          class="mt-4 bg-indigo-500 text-white px-6 py-2 rounded-full hover:bg-indigo-600 transition-all duration-200 flex items-center mx-auto"
        >
          <CheckIcon class="w-5 h-5 mr-2" /> Okay
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { AcademicCapIcon, PlayIcon, ExclamationCircleIcon, CheckIcon, DownloadIcon } from '@heroicons/vue/24/solid';
import { useCourses } from '@/components/student/composables/courses';
import { useHallTicketFeatures } from '@/components/student/composables/hallTicketFeatures';
import { useExam } from '@/components/student/composables/Exam';
import { ref, onMounted } from 'vue';
import axios from 'axios';
import apiConfig from '@/config/apiConfig';

export default {
  components: { AcademicCapIcon, PlayIcon, ExclamationCircleIcon, CheckIcon, DownloadIcon },
  props: {
    user: {
      type: Object,
      default: () => ({}),
    },
  },
  setup(props, { emit }) {
    const { courses, student, isLoading, errorMessage, fetchCourses } = useCourses();
    const { isExamActive, isLoading: isExamLoading, errorMessage: examErrorMessage, startExam } = useExam();
    const studentId = ref(props.user?.id || null);
    const { isDownloading, downloadHallTicketForStudent } = useHallTicketFeatures(studentId, emit);
    const isCheckingSession = ref(true);
    const showExamModal = ref(false);

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

    // Start exam functionality
    const handleStartExam = async (course) => {
      console.log(`[${new Date().toISOString()}] [Courses.vue] Start Exam clicked for course:`, course.id, course.name);
      
      if (!course.isEligible) {
        examErrorMessage.value = 'You are not eligible to take this exam';
        showExamModal.value = true;
        return;
      }
      if (!course.paymentConfirmed) {
        examErrorMessage.value = 'Payment not confirmed';
        showExamModal.value = true;
        return;
      }
      if (course.hasCompleted || course.hasMalpractice || course.hasExited) {
        examErrorMessage.value = getStartExamTooltip(course);
        showExamModal.value = true;
        return;
      }
      if (isExamActive.value) {
        examErrorMessage.value = 'An exam is already active';
        showExamModal.value = true;
        return;
      }

      try {
        await startExam(course.id, studentId.value);
        if (examErrorMessage.value) {
          showExamModal.value = true;
        }
      } catch (error) {
        console.error(`[${new Date().toISOString()}] [Courses.vue] Error starting exam:`, error.message);
        examErrorMessage.value = 'Failed to start exam';
        showExamModal.value = true;
      }
    };

    // Close the exam modal
    const closeExamModal = () => {
      showExamModal.value = false;
      examErrorMessage.value = '';
    };

    // Download hall ticket
    const downloadHallTicket = async (courseId) => {
      console.log(`[${new Date().toISOString()}] [Courses.vue] Download Hall Ticket clicked for courseId: ${courseId}, studentId: ${studentId.value}`);
      if (!studentId.value) {
        console.error(`[${new Date().toISOString()}] [Courses.vue] Student ID is missing`);
        errorMessage.value = 'Unable to download hall ticket: Please log in again.';
        emit('logout');
        return;
      }
      try {
        await downloadHallTicketForStudent(courseId);
        console.log(`[${new Date().toISOString()}] [Courses.vue] Hall ticket downloaded successfully for courseId: ${courseId}`);
      } catch (error) {
        console.error(`[${new Date().toISOString()}] [Courses.vue] Failed to download hall ticket:`, error.message);
        errorMessage.value = 'Failed to download hall ticket';
      }
    };

    // Tooltips for buttons
    const getStartExamTooltip = (course) => {
      if (!course.isEligible) return 'You are not eligible to take this exam';
      if (!course.paymentConfirmed) return 'Payment is not confirmed';
      if (course.hasCompleted) return 'Exam already completed';
      if (course.hasMalpractice) return 'Exam auto-evaluated due to malpractice';
      if (course.hasExited) return 'Exam already exited';
      if (isExamLoading.value) return 'Exam is starting';
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
      showExamModal,
      examErrorMessage,
      isExamLoading,
      handleStartExam,
      closeExamModal,
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

.scrollbar-hidden {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hidden::-webkit-scrollbar {
  display: none;
}

button:hover {
  transform: translateY(-1px);
}

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
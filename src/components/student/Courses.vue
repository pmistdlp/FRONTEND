<template>
  <div class="space-y-6 p-4 bg-blue text-indigo-600 relative">
    <!-- Course List View -->
    <div v-if="!isExamStarted">
      <h2 class="text-2xl font-bold transition-all duration-300 hover:text-blue-600 pb-4">My Courses</h2>

      <!-- No Courses -->
      <div v-if="!courses.length" class="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200 text-center">
        <p class="text-gray-600 text-sm">No courses assigned.</p>
      </div>

      <!-- Course List -->
      <div v-else class="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
        <h3 class="text-base font-semibold text-blue-500 mb-4 flex items-center">
          <AcademicCapIcon class="w-6 h-6 mr-2" /> Assigned Courses
        </h3>
        <div class="max-h-[400px] overflow-y-auto scrollbar-hidden">
          <table class="min-w-full bg-white border border-gray-200 rounded-md text-sm">
            <thead class="sticky top-0 bg-gray-100">
              <tr>
                <th class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">Name</th>
                <th class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">Course Code</th>
                <th class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">Platform</th>
                <th class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">Exam Date</th>
                <th class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">Exam Time</th>
                <th class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">Exam Duration</th>
                <th class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="course in courses" :key="course.id" class="hover:bg-gray-50 transition-all duration-200">
                <td class="py-2 px-3 border-b border-gray-200">{{ course.name }}</td>
                <td class="py-2 px-3 border-b border-gray-200">{{ course.courseCode || 'N/A' }}</td>
                <td class="py-2 px-3 border-b border-gray-200">{{ course.learningPlatform }}</td>
                <td class="py-2 px-3 border-b border-gray-200">{{ course.examDate || 'N/A' }}</td>
                <td class="py-2 px-3 border-b border-gray-200">{{ course.examTime || 'N/A' }} IST</td>
                <td class="py-2 px-3 border-b border-gray-200">120 Minutes</td>
                <td class="py-2 px-3 border-b border-gray-200">
                  <div class="flex space-x-2">
                    <button
                      @click="attemptStartExam(course)"
                      :disabled="isExamActive || course.hasCompleted"
                      class="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600 transition-all duration-200 flex items-center space-x-1 text-sm disabled:bg-green-300 disabled:cursor-not-allowed"
                    >
                      <PlayIcon class="w-4 h-4" v-if="!course.hasCompleted" />
                      <span>{{ course.hasCompleted ? 'You Successfully completed the exam!' : 'Start' }}</span>
                    </button>
                    <button
                      @click="downloadHallTicketForStudent(course.id)"
                      :disabled="!course.isEligible || !course.paymentConfirmed || isDownloading"
                      class="bg-indigo-500 text-white px-3 py-1 rounded-md hover:bg-indigo-600 disabled:bg-gray-400 transition-all duration-200 text-sm"
                    >
                      {{ isDownloading ? 'Downloading...' : 'Download Hall Ticket' }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Exam View -->
    <div v-else class="select-none">
      <!-- Top Timer Card -->
      <div class="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200 mb-4 flex justify-between items-center">
        <h2 class="text-2xl font-bold text-blue-500 flex items-center">
          <AcademicCapIcon class="w-6 h-6 mr-2" /> {{ selectedCourse.name }}
        </h2>
        <div class="timer-box">
          <div class="timer-display">{{ formatTime(remainingTime) }}</div>
          <div class="timer-progress">
            <div
              class="timer-progress-bar"
              :style="{ width: `${(remainingTime / 7200) * 100}%` }"
            ></div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isQuestionsLoading" class="text-center">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-blue.500 border-solid"></div>
        <p class="text-gray-600 mt-2 text-sm">Loading questions...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="questionsError" class="bg-red-50 p-4 rounded-lg shadow-sm border border-gray-200 text-center">
        <p class="text-red-600 text-sm">{{ questionsError }}</p>
      </div>

      <!-- No Questions -->
      <div v-else-if="questionsLoaded && !questions.phase1.length && !questions.phase2.length" class="text-center">
        <p class="text-gray-600 text-sm">No questions available for this course.</p>
      </div>

      <!-- Questions View -->
      <div v-else-if="questionsLoaded && (questions.phase1.length || questions.phase2.length)" class="flex flex-col lg:flex-row lg:space-x-4" ref="questionList">
        <!-- Left: Question View -->
        <div class="lg:flex-1 mb-4 lg:mb-0">
          <div v-if="currentQuestion" class="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
            <div class="flex justify-between items-start mb-4">
              <div class="text-base font-semibold text-gray-800">
                {{ currentQuestionIndexInAll + 1 }}: <span class="mathjax-content">{{ currentQuestion.question }}</span>
              </div>
              <div class="text-sm font-medium text-gray-600">
                {{ currentQuestion.coNumber }} | K {{ currentQuestion.kLevel }}
              </div>
            </div>
            <div v-if="currentQuestion.questionImage" class="mb-6">
              <img
                :src="currentQuestion.questionImage"
                alt="Question Image"
                class="w-[300px] h-[250px] rounded-md object-contain mx-auto"
                @error="handleImageError('questionImage', currentQuestion)"
              />
            </div>
            <div class="space-y-3">
              <div
                v-for="option in ['option1', 'option2', 'option3', 'option4']"
                :key="option"
                class="flex items-start space-x-2"
              >
                <div
                  @click="selectOption(currentQuestion.id, option)"
                  class="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center cursor-pointer transition-all duration-300"
                  :class="{
                    'bg-purple-500 border-purple-500': selectedAnswers[currentQuestion.id] === option,
                    'bg-gray-200 cursor-not-allowed': questionStatuses[currentQuestion.id] === 'submitted'
                  }"
                >
                  <svg
                    v-if="selectedAnswers[currentQuestion.id] === option"
                    class="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <label
                  :for="`q${currentQuestion.id}-${option}`"
                  class="flex-1 flex items-start space-x-2 p-2 rounded-md transition-all duration-300 cursor-pointer"
                  :class="{ 'cursor-not-allowed': questionStatuses[currentQuestion.id] === 'submitted' }"
                >
                  <span class="font-bold text-gray-700 text-sm">{{ option.slice(-1) }}:</span>
                  <div class="flex-1">
                    <span class="mathjax-content text-sm">{{ currentQuestion[option] }}</span>
                    <img
                      v-if="currentQuestion[`${option}Image`]"
                      :src="currentQuestion[`${option}Image`]"
                      :alt="`Option ${option.slice(-1)} Image`"
                      class="w-[60px] h-auto mt-2 rounded-md object-contain mx-auto"
                      @error="handleImageError(`${option}Image`, currentQuestion)"
                    />
                  </div>
                </label>
              </div>
            </div>
            <div class="mt-4 flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
              <div class="flex space-x-2">
                <button
                  @click="navigatePrevious"
                  :disabled="currentQuestionIndexInAll === 0"
                  class="bg-gray-200 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-300 transition-all duration-200 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  @click="navigateNext"
                  :disabled="currentQuestionIndexInAll === [...questions.phase1, ...questions.phase2].length - 1"
                  class="bg-gray-200 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-300 transition-all duration-200 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div class="flex space-x-2">
                <button
                  @click="markForReview(currentQuestion.id)"
                  :disabled="questionStatuses[currentQuestion.id] === 'submitted'"
                  class="bg-orange-500 text-white px-3 py-1 rounded-md hover:bg-orange-600 transition-all duration-200 text-sm disabled:bg-orange-300 disabled:cursor-not-allowed"
                >
                  Review Later
                </button>
                <button
                  @click="submitAnswer(currentQuestion.id)"
                  :disabled="!selectedAnswers[currentQuestion.id] || questionStatuses[currentQuestion.id] === 'submitted'"
                  class="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600 transition-all duration-200 text-sm disabled:bg-green-300 disabled:cursor-not-allowed"
                >
                  Submit Answer
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Phases Card -->
        <div class="lg:w-48 bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 class="text-base font-semibold text-blue-500 mb-4">Phases</h3>
          <div class="space-y-4">
            <!-- Phase 1 -->
            <div v-if="questions.phase1.length">
              <h4 class="text-sm font-medium text-gray-700 mb-2">Phase 1</h4>
              <div class="flex flex-wrap gap-2">
                <div
                  v-for="(question, index) in questions.phase1"
                  :key="question.id"
                  @click="selectQuestion('phase1', index)"
                  class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold cursor-pointer transition-all duration-300"
                  :class="getCircleClass(question.id)"
                >
                  {{ index + 1 }}
                </div>
              </div>
            </div>
            <!-- Phase 2 -->
            <div v-if="questions.phase2.length">
              <h4 class="text-sm font-medium text-gray-700 mb-2">Phase 2</h4>
              <div class="flex flex-wrap gap-2">
                <div
                  v-for="(question, index) in questions.phase2"
                  :key="question.id"
                  @click="selectQuestion('phase2', index)"
                  class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold cursor-pointer transition-all duration-300"
                  :class="getCircleClass(question.id)"
                >
                  {{ index + 1 }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Submit Exam Button -->
      <div v-if="questionsLoaded && (questions.phase1.length || questions.phase2.length)" class="mt-4 flex justify-center space-x-2">
        <button
          @click="showExitModal"
          class="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition-all duration-200 text-sm"
        >
          Exit Exam
        </button>
        <button
          @click="submitExam"
          :disabled="!canSubmit"
          class="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 transition-all duration-200 text-sm disabled:bg-blue-300 disabled:cursor-not-allowed"
        >
          Submit Exam
        </button>
      </div>

      <!-- Exit Confirmation Modal -->
      <div v-if="showExitModalFlag" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white p-4 rounded-lg shadow-lg border border-gray-200 w-full max-w-md">
          <h3 class="text-base font-semibold text-red-500 mb-4 flex items-center">
            <ExclamationCircleIcon class="w-6 h-6 mr-2" /> Are you sure?
          </h3>
          <p class="text-gray-700 mb-4 text-sm">Are you sure you want to exit the exam? Unselected questions will be assigned 0 marks.</p>
          <div class="flex justify-end space-x-2">
            <button
              @click="confirmExit"
              class="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition-all duration-200 text-sm"
            >
              Yes
            </button>
            <button
              @click="showExitModalFlag = false"
              class="bg-gray-200 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-300 transition-all duration-200 text-sm"
            >
              No
            </button>
          </div>
        </div>
      </div>

      <!-- Malpractice Warning Overlay -->
      <div v-if="showMalpracticeWarning" class="fixed inset-0 bg-red-500 bg-opacity-75 flex items-center justify-center z-50">
        <div class="bg-white p-6 rounded-lg shadow-lg border border-gray-200 w-full max-w-md text-center">
          <h3 class="text-lg font-semibold text-red-600 mb-4 flex items-center justify-center">
            <ExclamationTriangleIcon class="w-8 h-8 mr-2" /> Malpractice Detected!
          </h3>
          <p class="text-gray-700 mb-4 text-sm">
            This is an initial warning. If this repeats, your exam will be auto-evaluated due to malpractice!
          </p>
          <button
            @click="dismissMalpracticeWarning"
            class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-all duration-200 text-sm"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import moment from 'moment-timezone';
import axios from 'axios';
import apiConfig from '@/config/apiConfig';
import { AcademicCapIcon, PlayIcon, ArrowRightIcon, ExclamationCircleIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/solid';
import { jsPDF } from 'jspdf';

// Import logo and signature images
import uletkzLogo from '@/images/uletkz.png';
import pmistLogo from '@/images/pmist.png';
import nodalOfficerSignature from '@/images/nodalofficer-signature.png';

// Create Axios instance without baseURL initially
const api = axios.create({ withCredentials: true });

// Debounce function to limit frequent MathJax calls
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Utility to fetch image as base64
async function fetchImageAsBase64(url) {
  console.log(`Attempting to fetch image from: ${url}`);
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    console.log(`Image fetch successful, response length: ${response.data.length} bytes`);
    const base64Image = Buffer.from(response.data, 'binary').toString('base64');
    // Determine the MIME type based on the file extension
    const extension = url.split('.').pop().toLowerCase();
    const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';
    return `data:${mimeType};base64,${base64Image}`;
  } catch (error) {
    console.error('Error fetching image as base64:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return null;
  }
}

export default {
  components: { AcademicCapIcon, PlayIcon, ArrowRightIcon, ExclamationCircleIcon, ExclamationTriangleIcon },
  props: {
    courses: {
      type: Array,
      default: () => [],
    },
    isExamActive: {
      type: Boolean,
      default: false,
    },
    user: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      selectedCourse: null,
      questions: { phase1: [], phase2: [] },
      isQuestionsLoading: false,
      questionsLoaded: false,
      questionsError: '',
      mathJaxLoaded: false,
      mathJaxFailed: false,
      mutationObserver: null,
      debouncedTypesetMathJax: debounce(() => {
        this.typesetMathJax();
      }, 300),
      selectedAnswers: {},
      questionStatuses: {},
      currentPhase: null,
      currentQuestionIndex: null,
      remainingTime: 7200,
      timerInterval: null,
      examStartedAt: null,
      showExitModalFlag: false,
      isExamStarted: false,
      showMalpracticeWarning: false,
      malpracticeAttempts: 0,
      hasMalpractice: false,
      isDownloading: false,
      baseUrl: '',
    };
  },
  computed: {
    canSubmit() {
      const allQuestions = [...this.questions.phase1, ...this.questions.phase2];
      return allQuestions.every(question => this.questionStatuses[question.id] === 'submitted');
    },
    currentQuestion() {
      if (!this.currentPhase || this.currentQuestionIndex === null) return null;
      return this.questions[this.currentPhase][this.currentQuestionIndex];
    },
    currentQuestionIndexInAll() {
      if (!this.currentPhase || this.currentQuestionIndex === null) return -1;
      if (this.currentPhase === 'phase1') {
        return this.currentQuestionIndex;
      } else {
        return this.questions.phase1.length + this.currentQuestionIndex;
      }
    },
    studentId() {
      return this.user?.id;
    },
  },
  watch: {
    selectedCourse(newVal, oldVal) {
      if (newVal && (!oldVal || newVal.id !== oldVal.id)) {
        this.$nextTick(() => this.debouncedTypesetMathJax());
      }
    },
    questions: {
      handler() {
        this.$nextTick(() => this.debouncedTypesetMathJax());
      },
      deep: true,
    },
    currentQuestion(newVal) {
      if (newVal) {
        this.$nextTick(() => this.debouncedTypesetMathJax());
      }
    },
    isExamStarted(newVal) {
      this.$emit('exam-status-changed', newVal);
    },
    courses(newVal) {
      console.log('Courses prop updated:', newVal);
    },
  },
  async created() {
    if (!this.studentId) {
      console.error('No student ID available');
      this.$emit('show-message', 'Please log in to access your courses.');
      return;
    }
    console.log('Student ID in Courses.vue:', this.studentId);
    console.log('Initial courses prop:', this.courses);
    try {
      const baseURL = await apiConfig.getBaseURL();
      api.defaults.baseURL = baseURL;
      this.baseUrl = baseURL;
      console.log('[Frontend] Base URL set to:', baseURL);
    } catch (error) {
      console.error('[Frontend] Failed to fetch base URL:', error);
      api.defaults.baseURL = 'http://localhost:3000';
      this.baseUrl = 'http://localhost:3000';
      console.log('[Frontend] Using fallback base URL:', api.defaults.baseURL);
    }
  },
  methods: {
    isEligible(course) {
      if (!course.isEligible) {
        this.$emit('show-message', 'You are not eligible to take this exam.');
        return false;
      }
      return true;
    },
    isPaymentConfirmed(course) {
      if (!course.paymentConfirmed) {
        this.$emit('show-message', 'Payment not confirmed for this exam.');
        return false;
      }
      return true;
    },
    isWithinTimeWindow(course) {
      const now = moment.tz('Asia/Kolkata');
      const examDateTime = moment.tz(
        `${course.examDate} ${course.examTime}`,
        'YYYY-MM-DD HH:mm',
        'Asia/Kolkata'
      );
      const windowEnd = examDateTime.clone().add(30, 'minutes');

      const isSameDate = now.isSame(examDateTime, 'day');
      const isWithinTime = now.isBetween(examDateTime, windowEnd, null, '[]');

      if (!isSameDate) {
        if (now.isBefore(examDateTime)) {
          this.$emit('show-message', 'Exam Not Yet Started');
        } else {
          this.$emit('show-message', 'Exam Elapsed');
        }
        return false;
      }
      if (!isWithinTime) {
        if (now.isBefore(examDateTime)) {
          this.$emit('show-message', 'Exam Not Yet Started');
        } else {
          this.$emit('show-message', 'Exam Elapsed');
        }
        return false;
      }
      return true;
    },
    isBeforeExam(course) {
      const now = moment.tz('Asia/Kolkata');
      const examDateTime = moment.tz(
        `${course.examDate} ${course.examTime}`,
        'YYYY-MM-DD HH:mm',
        'Asia/Kolkata'
      );
      return now.isBefore(examDateTime);
    },
    attemptStartExam(course) {
      if (course.hasCompleted) {
        this.$emit('show-message', 'You have already completed this exam.');
        return;
      }
      if (!this.isEligible(course) || !this.isPaymentConfirmed(course) || !this.isWithinTimeWindow(course)) {
        return;
      }
      this.isExamStarted = true;
      this.startExam(course);
      this.setupMalpracticePrevention();
    },
    async startExam(course) {
      this.selectedCourse = course;
      console.log('Starting exam for course:', course);
      this.isQuestionsLoading = true;
      this.questionsLoaded = false;
      this.questionsError = '';
      this.questions = { phase1: [], phase2: [] };
      this.selectedAnswers = {};
      this.questionStatuses = {};
      this.currentPhase = null;
      this.currentQuestionIndex = null;
      this.remainingTime = 7200;
      this.examStartedAt = new Date().toISOString();

      this.startTimer();

      try {
        const baseURL = await apiConfig.getBaseURL();
        console.log('Fetching questions with baseURL:', baseURL);
        const url = `${baseURL}/api/student-courses/questions/${course.id}`;
        console.log('Fetching from URL:', url);
        const response = await axios.get(url);
        console.log('Questions fetch response:', {
          status: response.status,
          data: response.data,
        });
        this.questions = response.data;
        console.log('Loaded questions:', this.questions);

        [...this.questions.phase1, ...this.questions.phase2].forEach(question => {
          this.selectedAnswers[question.id] = null;
          this.questionStatuses[question.id] = 'default';
        });
        console.log('Initialized selectedAnswers:', this.selectedAnswers);
        console.log('Initialized questionStatuses:', this.questionStatuses);

        if (this.questions.phase1.length > 0) {
          this.currentPhase = 'phase1';
          this.currentQuestionIndex = 0;
        } else if (this.questions.phase2.length > 0) {
          this.currentPhase = 'phase2';
          this.currentQuestionIndex = 0;
        }

        this.$nextTick(() => this.debouncedTypesetMathJax());
      } catch (error) {
        console.error('Error fetching questions:', {
          message: error.message,
          response: error.response ? {
            status: error.response.status,
            data: error.response.data,
          } : 'No response',
        });
        this.questionsError = `Failed to fetch questions: ${error.message}`;
      } finally {
        this.isQuestionsLoading = false;
        this.questionsLoaded = true;
        console.log('Questions fetch completed. State:', {
          isQuestionsLoading: this.isQuestionsLoading,
          questionsLoaded: this.questionsLoaded,
          questionsError: this.questionsError,
          questions: this.questions,
        });
      }
    },
    startTimer() {
      if (this.timerInterval) clearInterval(this.timerInterval);
      this.timerInterval = setInterval(() => {
        if (this.remainingTime > 0) {
          this.remainingTime--;
        } else {
          this.submitExam(true);
        }
      }, 1000);
    },
    formatTime(seconds) {
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },
    goBackToCourses() {
      if (this.timerInterval) clearInterval(this.timerInterval);
      this.selectedCourse = null;
      this.questions = { phase1: [], phase2: [] };
      this.isQuestionsLoading = false;
      this.questionsLoaded = false;
      this.questionsError = '';
      this.selectedAnswers = {};
      this.questionStatuses = {};
      this.currentPhase = null;
      this.currentQuestionIndex = null;
      this.remainingTime = 7200;
      this.examStartedAt = null;
      this.showExitModalFlag = false;
      this.isExamStarted = false;
      this.malpracticeAttempts = 0;
      this.showMalpracticeWarning = false;
      this.hasMalpractice = false;
      this.removeMalpracticePrevention();
    },
    showExitModal() {
      this.showExitModalFlag = true;
    },
    async confirmExit() {
      await this.submitExam(true);
      this.goBackToCourses();
    },
    selectQuestion(phase, index) {
      this.currentPhase = phase;
      this.currentQuestionIndex = index;
      this.$nextTick(() => this.debouncedTypesetMathJax());
    },
    navigatePrevious() {
      const allQuestions = [...this.questions.phase1, ...this.questions.phase2];
      const currentIndex = this.currentQuestionIndexInAll;
      if (currentIndex > 0) {
        const newIndex = currentIndex - 1;
        if (newIndex < this.questions.phase1.length) {
          this.currentPhase = 'phase1';
          this.currentQuestionIndex = newIndex;
        } else {
          this.currentPhase = 'phase2';
          this.currentQuestionIndex = newIndex - this.questions.phase1.length;
        }
        this.$nextTick(() => this.debouncedTypesetMathJax());
      }
    },
    navigateNext() {
      const allQuestions = [...this.questions.phase1, ...this.questions.phase2];
      const currentIndex = this.currentQuestionIndexInAll;
      if (currentIndex < allQuestions.length - 1) {
        const newIndex = currentIndex + 1;
        if (newIndex < this.questions.phase1.length) {
          this.currentPhase = 'phase1';
          this.currentQuestionIndex = newIndex;
        } else {
          this.currentPhase = 'phase2';
          this.currentQuestionIndex = newIndex - this.questions.phase1.length;
        }
        this.$nextTick(() => this.debouncedTypesetMathJax());
      }
    },
    getCircleClass(questionId) {
      const status = this.questionStatuses[questionId];
      if (status === 'review') {
        return 'bg-orange-500 text-white';
      } else if (status === 'submitted') {
        return 'bg-green-500 text-white';
      } else {
        return 'bg-white text-purple-600 border-2 border-purple-600';
      }
    },
    selectOption(questionId, option) {
      if (this.questionStatuses[questionId] === 'submitted') return;
      this.selectedAnswers[questionId] = option;
      console.log('Selected answers:', this.selectedAnswers);
    },
    markForReview(questionId) {
      this.questionStatuses[questionId] = 'review';
      console.log('Question statuses:', this.questionStatuses);
      this.navigateNext();
    },
    submitAnswer(questionId) {
      if (!this.selectedAnswers[questionId]) {
        this.$emit('show-message', 'Please select an option before submitting.');
        return;
      }
      this.questionStatuses[questionId] = 'submitted';
      console.log('Question statuses:', this.questionStatuses);
      this.navigateNext();
    },
    async submitExam(isAutoSubmit = false) {
      if (!isAutoSubmit && !this.canSubmit) {
        this.$emit('show-message', 'Please submit all questions before submitting the exam.');
        return;
      }

      if (this.timerInterval) clearInterval(this.timerInterval);

      const allQuestions = [...this.questions.phase1, ...this.questions.phase2];
      const answers = allQuestions.map(question => ({
        questionId: question.id,
        selectedAnswer: this.selectedAnswers[question.id] || null,
        startTime: this.examStartedAt,
      }));

      try {
        const baseURL = await apiConfig.getBaseURL();
        const response = await axios.post(`${baseURL}/api/student-courses/submit-exam`, {
          studentId: this.studentId,
          courseId: this.selectedCourse.id,
          answers,
          isMalpractice: this.hasMalpractice,
        });
        // Update course completion status in frontend (Vue 3 reactivity)
        const courseIndex = this.courses.findIndex(c => c.id === this.selectedCourse.id);
        if (courseIndex !== -1) {
          this.courses[courseIndex] = { ...this.courses[courseIndex], hasCompleted: true };
        }
        this.showMalpracticeWarning = false;
        this.$emit('show-message', response.data.message);
        this.goBackToCourses();
      } catch (error) {
        console.error('Error submitting exam:', error.response?.data || error.message);
        this.$emit('show-message', `Failed to submit exam: ${error.response?.data.error || error.message}`);
      }
    },
    async logMalpractice(type) {
      if (!this.selectedCourse) return;
      try {
        const baseURL = await apiConfig.getBaseURL();
        await axios.post(`${baseURL}/api/student-courses/malpractice`, {
          studentId: this.studentId,
          courseId: this.selectedCourse.id,
          type,
        });
        console.log(`Malpractice logged: ${type}`);
      } catch (error) {
        console.error('Error logging malpractice:', error.response?.data || error.message);
      }
    },
    handleImageError(field, question) {
      console.error(`Failed to load image for ${field}:`, question[field]);
      question[field] = null;
    },
    setupMalpracticePrevention() {
      const preventCopy = (e) => {
        e.preventDefault();
        this.logMalpractice('copy');
        this.handleMalpractice();
      };
      document.addEventListener('copy', preventCopy);

      const preventContextMenu = (e) => {
        e.preventDefault();
        this.logMalpractice('contextmenu');
        this.handleMalpractice();
      };
      document.addEventListener('contextmenu', preventContextMenu);

      const detectScreenshot = (e) => {
        const isScreenshotKey =
          e.key === 'PrintScreen' ||
          (e.metaKey && e.shiftKey && e.key === 'S') ||
          (e.ctrlKey && e.altKey && e.key === 'S') ||
          (e.altKey && e.key === 'PrintScreen') ||
          (e.ctrlKey && e.shiftKey && e.key === 'S');
        if (isScreenshotKey) {
          e.preventDefault();
          this.logMalpractice('screenshot_key');
          this.handleMalpractice();
        }
      };
      document.addEventListener('keydown', detectScreenshot);

      const detectClipboardImage = async (e) => {
        try {
          const items = (e.clipboardData || window.clipboardData).items;
          for (const item of items) {
            if (item.type.includes('image')) {
              this.logMalpractice('screenshot_clipboard');
              this.handleMalpractice();
            }
          }
        } catch (error) {
          console.error('Error checking clipboard:', error);
        }
      };
      document.addEventListener('paste', detectClipboardImage);

      const detectFocusLoss = () => {
        if (document.visibilityState === 'hidden') {
          this.logMalpractice('tab_switch');
          this.handleMalpractice();
        }
      };
      document.addEventListener('visibilitychange', detectFocusLoss);

      const detectWindowBlur = () => {
        this.logMalpractice('window_blur');
        this.handleMalpractice();
      };
      window.addEventListener('blur', detectWindowBlur);

      this.malpracticeEventHandlers = {
        copy: preventCopy,
        contextmenu: preventContextMenu,
        keydown: detectScreenshot,
        paste: detectClipboardImage,
        visibilitychange: detectFocusLoss,
        blur: detectWindowBlur,
      };
    },
    removeMalpracticePrevention() {
      if (this.malpracticeEventHandlers) {
        document.removeEventListener('copy', this.malpracticeEventHandlers.copy);
        document.removeEventListener('contextmenu', this.malpracticeEventHandlers.contextmenu);
        document.removeEventListener('keydown', this.malpracticeEventHandlers.keydown);
        document.removeEventListener('paste', this.malpracticeEventHandlers.paste);
        document.removeEventListener('visibilitychange', this.malpracticeEventHandlers.visibilitychange);
        window.removeEventListener('blur', this.malpracticeEventHandlers.blur);
        this.malpracticeEventHandlers = null;
      }
    },
    handleMalpractice() {
      this.malpracticeAttempts += 1;
      console.log('Malpractice attempt:', this.malpracticeAttempts);

      if (this.malpracticeAttempts === 1) {
        this.showMalpracticeWarning = true;
      } else if (this.malpracticeAttempts >= 2) {
        this.hasMalpractice = true;
        this.submitExam(true);
      }
    },
    dismissMalpracticeWarning() {
      this.showMalpracticeWarning = false;
      console.log('Malpractice warning dismissed');
    },
    async typesetMathJax() {
      if (this.mathJaxFailed || !this.mathJaxLoaded) return;

      if (window.MathJax && window.MathJax.typesetPromise) {
        try {
          const elements = document.querySelectorAll('.mathjax-content');
          if (elements.length > 0) {
            await window.MathJax.typesetPromise([...elements]);
            console.log('MathJax typesetting completed successfully');
          }
        } catch (error) {
          console.error('MathJax typesetting error:', error);
          this.mathJaxFailed = true;
          this.$emit('show-message', 'Failed to render formulas. Displaying raw text. Please check your internet connection.');
        }
      }
    },
    loadMathJax(attempt = 1, maxAttempts = 3) {
      if (window.MathJax) {
        this.mathJaxLoaded = true;
        this.$nextTick(() => this.debouncedTypesetMathJax());
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
      script.async = true;
      script.onload = () => {
        this.mathJaxLoaded = true;
        console.log('MathJax loaded successfully');
        window.MathJax = {
          tex: {
            inlineMath: [['\\(', '\\)']],
            displayMath: [['\\[', '\\]']],
            tags: 'ams',
          },
          options: {
            skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
            ignoreHtmlClass: 'mathjax-ignore',
          },
        };
        this.$nextTick(() => this.debouncedTypesetMathJax());
      };
      script.onerror = () => {
        console.error(`Failed to load MathJax (attempt ${attempt})`);
        if (attempt < maxAttempts) {
          console.log(`Retrying MathJax load (attempt ${attempt + 1})`);
          setTimeout(() => this.loadMathJax(attempt + 1, maxAttempts), 1000);
        } else {
          this.mathJaxFailed = true;
          this.$emit('show-message', 'Failed to load MathJax after multiple attempts. Formulas will be displayed as raw text.');
        }
      };
      document.head.appendChild(script);
    },
    setupMutationObserver() {
      const targetNode = document.querySelector('.space-y-6');
      if (!targetNode) return;

      const config = { childList: true, subtree: true };

      const callback = (mutationsList) => {
        for (const mutation of mutationsList) {
          if (mutation.type === 'childList') {
            const hasMathJaxContent = Array.from(mutation.addedNodes).some(
              node => node.nodeType === 1 && node.querySelector('.mathjax-content')
            );
            if (hasMathJaxContent) {
              this.$nextTick(() => this.debouncedTypesetMathJax());
            }
          }
        }
      };

      this.mutationObserver = new MutationObserver(callback);
      this.mutationObserver.observe(targetNode, config);
    },
    async downloadHallTicketForStudent(courseId) {
      console.log('[Frontend] Initiating hall ticket download for student ID:', this.studentId, 'Course ID:', courseId);
      this.isDownloading = true;
      try {
        const payload = {
          courseId: courseId,
          studentIds: [this.studentId],
        };
        console.log('[Frontend] Sending hall ticket request to backend:', payload);
        const response = await api.post('/api/admin-enrollments/hall-ticket', payload);
        console.log('[Frontend] Received hall ticket response:', response.data);
        const { hallTickets } = response.data;
        if (hallTickets.length === 0) {
          throw new Error('No hall ticket data returned from backend');
        }
        console.log('[Frontend] Hall tickets data:', hallTickets);
        this.generateHallTicketPDF(hallTickets);
      } catch (error) {
        const errorMsg = error.response?.data?.error || error.message;
        console.error('[Frontend] Error generating hall ticket:', errorMsg);
        this.$emit('show-message', `Failed to generate hall ticket: ${errorMsg}`);
      } finally {
        this.isDownloading = false;
        console.log('[Frontend] Hall ticket download process complete, downloading state:', this.isDownloading);
      }
    },
    async generateHallTicketPDF(hallTickets) {
      console.log('[Frontend] Starting PDF generation with jsPDF for hall tickets:', hallTickets);
      const doc = new jsPDF();
      let yOffset = 10;

      for (const [index, ticket] of hallTickets.entries()) {
        const { student, course } = ticket;
        console.log(`[Frontend] Generating PDF content for hall ticket ${index + 1}, student: ${student.name}`);

        if (index > 0) {
          doc.addPage();
          yOffset = 10;
        }

        // Header with Logos and Text Aligned on the Same Line
        const logoY = yOffset;
        doc.addImage(uletkzLogo, 'PNG', 10, logoY, 30, 12);
        doc.addImage(pmistLogo, 'PNG', 170, logoY, 30, 12);

        const textBlockStartX = 40;
        const textBlockWidth = 130;
        const textBlockCenterX = textBlockStartX + textBlockWidth / 2;

        yOffset += 4;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('CENTRE FOR ONLINE AND BLENDED LEARNING', textBlockCenterX, yOffset, { align: 'center' });
        yOffset += 6;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Periyar Maniammai Institute of Science & Technology', textBlockCenterX, yOffset, { align: 'center' });
        yOffset += 5;
        doc.text('Periyar Nagar, Vallam, Thanjavur - 613403', textBlockCenterX, yOffset, { align: 'center' });
        yOffset += 5;
        doc.text('www.moocs.pmu.edu', textBlockCenterX, yOffset, { align: 'center' });

        yOffset += 10;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('END-TERM PROCTORED EXAMINATION, MAY - JUNE 2025', 105, yOffset, { align: 'center' });
        yOffset += 8;
        doc.setFontSize(16);
        doc.text('HALL TICKET', 105, yOffset, { align: 'center' });
        yOffset += 15;

        const candidateStartY = yOffset;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Name of the Candidate:', 10, yOffset);
        doc.setFont('helvetica', 'normal');
        doc.text(student.name, 60, yOffset);
        yOffset += 8;
        doc.setFont('helvetica', 'bold');
        doc.text('Register Number:', 10, yOffset);
        doc.setFont('helvetica', 'normal');
        doc.text(student.registerNo, 60, yOffset);
        yOffset += 8;
        doc.setFont('helvetica', 'bold');
        doc.text('ABC ID:', 10, yOffset);
        doc.setFont('helvetica', 'normal');
        doc.text(student.abcId || '-', 60, yOffset);

        doc.setFont('helvetica', 'normal');
        doc.rect(160, candidateStartY, 30, 30);

        if (student.photo) {
          try {
            const photoUrl = `${this.baseUrl}${student.photo}`;
            console.log(`Fetching student photo from: ${photoUrl}`);
            const photoBase64 = await fetchImageAsBase64(photoUrl);
            if (photoBase64) {
              const extension = student.photo.split('.').pop().toLowerCase();
              const imageFormat = extension === 'png' ? 'PNG' : 'JPEG';
              console.log(`Adding image to PDF, format: ${imageFormat}`);
              doc.addImage(photoBase64, imageFormat, 160, candidateStartY, 30, 30);
            } else {
              console.warn(`Failed to fetch student photo, using default placeholder`);
              doc.setFontSize(8);
              const line1 = 'Paste your';
              const line2 = 'recent photo';
              const maxWidth = 26;
              const line1Width = doc.getTextWidth(line1);
              const line2Width = doc.getTextWidth(line2);
              const line1X = 160 + (30 - line1Width) / 2;
              const line2X = 160 + (30 - line2Width) / 2;
              const line1Y = candidateStartY + 12;
              const line2Y = candidateStartY + 18;
              doc.text(line1, line1X, line1Y);
              doc.text(line2, line2X, line2Y);
            }
          } catch (error) {
            console.error(`Error adding student photo to PDF:`, error);
            doc.setFontSize(8);
            const line1 = 'Paste your';
            const line2 = 'recent photo';
            const maxWidth = 26;
            const line1Width = doc.getTextWidth(line1);
            const line2Width = doc.getTextWidth(line2);
            const line1X = 160 + (30 - line1Width) / 2;
            const line2X = 160 + (30 - line2Width) / 2;
            const line1Y = candidateStartY + 12;
            const line2Y = candidateStartY + 18;
            doc.text(line1, line1X, line1Y);
            doc.text(line2, line2X, line2Y);
          }
        } else {
          console.log(`No photo uploaded for student ${student.registerNo}, using default placeholder`);
          doc.setFontSize(8);
          const line1 = 'Paste your';
          const line2 = 'recent photo';
          const maxWidth = 26;
          const line1Width = doc.getTextWidth(line1);
          const line2Width = doc.getTextWidth(line2);
          const line1X = 160 + (30 - line1Width) / 2;
          const line2X = 160 + (30 - line2Width) / 2;
          const line1Y = candidateStartY + 12;
          const line2Y = candidateStartY + 18;
          doc.text(line1, line1X, line1Y);
          doc.text(line2, line2X, line2Y);
        }
        doc.setFontSize(10);
        yOffset += 10;

        yOffset += 12;

        doc.setFontSize(12 | undefined);
        doc.setFont('helvetica', 'bold');
        doc.text('Course Details', 10, yOffset);
        yOffset += 6;
        doc.setLineWidth(0.2);
        doc.setDrawColor(0);
        doc.setFillColor(240, 240, 240);

        const tableX = 10;
        const tableWidths = [30, 60, 30, 30, 30];
        const headers = ['Course Code', 'Course Name', 'Date', 'Time', 'Venue'];
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        headers.forEach((header, i) => {
          doc.text(header, tableX + tableWidths.slice(0, i).reduce((a, b) => a + b, 0) + 2, yOffset);
        });
        yOffset += 2;
        doc.line(tableX, yOffset, tableX + tableWidths.reduce((a, b) => a + b, 0), yOffset);
        yOffset += 4;

        doc.setFont('helvetica', 'normal');
        const rowData = [
          course.courseCode || '-',
          course.name,
          course.examDate,
          course.examTime,
          'PKC Lab 1'
        ];
        rowData.forEach((data, i) => {
          doc.text(data, tableX + tableWidths.slice(0, i).reduce((a, b) => a + b, 0) + 2, yOffset);
        });
        yOffset += 2;
        doc.line(tableX, yOffset, tableX + tableWidths.reduce((a, b) => a + b, 0), yOffset);
        yOffset += 10;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('GENERAL INSTRUCTIONS', 10, yOffset);
        yOffset += 6;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const instructions = [
          'Hall Ticket (with recent passport-size photo) and original Institute ID Card must be presented for verification.',
          'Printed Hall Ticket with photo is mandatory. Digital copies on mobile phones or other devices will not be accepted.',
          'Ensure eligibility and fee payment status are confirmed prior to entry.',
          'Report to the exam venue at least 15 minutes before the exam starts.',
          'White sheets will be provided upon request. Candidates must write their name and register number on each sheet before use. All sheets (used/unused) must be returned to the invigilator after the exam.',
          'Formal dress code is mandatory.',
          'Candidates must bring their own pen, pencil, and eraser.',
          'Maintain proper code of conduct throughout the exam. PSNO reserves the right to take disciplinary action in case of misconduct.',
          'In case of delays due to unforeseen circumstances, PSNO will determine the appropriate course of action as it deems fit.',
          'All digital/electronic devices and unauthorized printed/written materials are strictly prohibited in the exam centre.'
        ];
        instructions.forEach(instruction => {
          doc.setFillColor(0, 0, 0);
          doc.circle(12, yOffset - 1, 1, 'F');
          const lines = doc.splitTextToSize(instruction, 175);
          lines.forEach((line, lineIndex) => {
            doc.text(line, 16, yOffset);
            yOffset += 5;
          });
        });
        yOffset += 12;

        const signatureStartY = yOffset;
        doc.addImage(nodalOfficerSignature, 'PNG', 160, signatureStartY, 40, 15);
        yOffset += 20;
        doc.setFontSize(10);
        doc.text('Signature of the Candidate', 10, yOffset);
        doc.setFontSize(10);
        doc.text('PMIST SWAYAM Nodal Officer (PSNO)', 140, yOffset);
        doc.setFontSize(10);
        yOffset += 25;

        doc.setFontSize(8);
        const footerY = 280;
        const currentDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/');
        doc.text(`Issued on: ${currentDate}`, 10, footerY);
        doc.text('Contact the PMIST SWAYAM Nodal Office for any discrepancies.', 10, footerY + 5);
        doc.text(`Page ${index + 1} of ${hallTickets.length}`, 190, footerY + 5, { align: 'right' });
      }

      const fileName = `hall_ticket_${this.selectedCourseId}_${hallTickets[0].student.id}.pdf`;
      console.log('[Frontend] Saving PDF as:', fileName);
      doc.save(fileName);
      console.log('[Frontend] PDF download triggered successfully');
    },
    clearSessionData() {
      // Clear all exam-related data to prevent session persistence
      this.goBackToCourses();
      this.selectedCourse = null;
      this.questions = { phase1: [], phase2: [] };
      this.selectedAnswers = {};
      this.questionStatuses = {};
    },
  },
  mounted() {
    this.loadMathJax();
    this.$nextTick(() => {
      this.setupMutationObserver();
    });
  },
  updated() {
    if (this.mathJaxLoaded && !this.mathJaxFailed) {
      this.$nextTick(() => this.debouncedTypesetMathJax());
    }
  },
  beforeUnmount() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }
    this.removeMalpracticePrevention();
    this.clearSessionData();
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

.space-y-6 {
  --space-y: 1.5rem;
}

.space-y-4 {
  --space-y: 1rem;
}

.space-y-3 {
  --space-y: 0.75rem;
}

.space-y-2 {
  --space-y: 0.5rem;
}

.space-x-4 {
  --space-x: 1rem;
}

.space-x-2 {
  --space-x: 0.5rem;
}

.space-y-6 > * + *,
.space-y-4 > * + *,
.space-y-3 > * + *,
.space-y-2 > * + * {
  margin-top: var(--space-y);
}

.space-x-4 > * + *,
.space-x-2 > * + * {
  margin-left: var(--space-x);
}

.transition-all {
  transition: all 0.2s ease;
}

.timer-box {
  width: 120px;
  height: 60px;
  background: linear-gradient(135deg, #3b82f6, #1e3a8a);
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 8px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
}

.timer-box::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.2), transparent);
  opacity: 0.3;
  animation: pulse 3s infinite;
}

.timer-display {
  font-family: 'Poppins', sans-serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: #ffffff;
  text-align: center;
  letter-spacing: 1px;
  z-index: 1;
}

.timer-progress {
  height: 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  overflow: hidden;
  z-index: 1;
}

.timer-progress-bar {
  height: 100%;
  background: #22c55e;
  transition: width 1s linear;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 0.3;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.5;
  }
  100% {
    transform: scale(1);
    opacity: 0.3;
  }
}

.mathjax-content {
  display: inline-block;
  min-height: 1.5em;
}

img {
  height: auto;
  object-fit: contain;
}

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

.select-none {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

@media (max-width: 1024px) {
  .lg\:flex-row {
    flex-direction: column;
  }
  .lg\:space-x-4 {
    --space-x: 0;
    --space-y: 1rem;
  }
  .lg\:flex-1 {
    width: 100%;
  }
  .lg\:w-48 {
    width: 100%;
  }
  .lg\:mb-0 {
    margin-bottom: 1rem;
  }
}

@media (max-width: 640px) {
  .p-4 {
    padding: 0.75rem;
  }
  .text-2xl {
    font-size: 1.25rem;
  }
  .text-base {
    font-size: 0.875rem;
  }
  .text-sm {
    font-size: 0.75rem;
  }
  .text-xs {
    font-size: 0.625rem;
  }
  .w-10 {
    width: 2.5rem;
  }
  .h-10 {
    height: 2.5rem;
  }
  .w-8 {
    width: 1.75rem;
  }
  .h-8 {
    height: 1.75rem;
  }
  .w-6 {
    width: 1.25rem;
  }
  .h-6 {
    height: 1.25rem;
  }
  .px-3 {
    padding-left: 0.5rem;
    padding-right: 0.5rem;
  }
  .py-1 {
    padding-top: 0.25rem;
    padding-bottom: 0.25rem;
  }
  .w-\[300px\] {
    width: 160px;
  }
  .h-\[250px\] {
    height: 120px;
  }
  .w-\[60px\] {
    width: 50px;
  }
  table {
    font-size: 0.75rem;
  }
  th, td {
    padding: 0.5rem;
  }
  .max-w-md {
    width: 90%;
  }
  .timer-box {
    width: 100px;
    height: 50px;
  }
  .timer-display {
    font-size: 1rem;
  }
}
</style>
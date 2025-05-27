<template>
  <div class="space-y-6 p-4 bg-blue text-indigo-600 relative" ref="container">
    <!-- Course List View -->
    <div v-if="!isExamStarted && !showResultsView">
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
                      v-if="!course.hasCompleted && !course.hasMalpractice"
                      @click="attemptStartExam(course)"
                      :disabled="isRestricted || isExamActive"
                      class="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600 transition-all duration-200 flex items-center space-x-1 text-sm disabled:bg-green-300 disabled:cursor-not-allowed"
                    >
                      <PlayIcon class="w-4 h-4" />
                      <span>Start</span>
                    </button>
                    <span
                      v-else
                      class="text-red-600 text-sm font-medium"
                    >
                      {{ course.hasMalpractice ? 'Your Test Auto Evaluated Due to Malpractice' : 'You Successfully completed the exam!' }}
                    </span>
                    <button
                      @click="console.log('Course ID:', course.id); downloadHallTicketForStudent(course.id)"
                      :disabled="isRestricted || !course.isEligible || !course.paymentConfirmed || isDownloading"
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
    <div v-else-if="isExamStarted && !showResultsView" class="select-none">
      <!-- Top Timer Card -->
      <div class="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200 mb-4 flex justify-between items-center">
        <h2 class="text-2xl font-bold text-blue-500 flex items-center">
          <AcademicCapIcon class="w-6 h-6 mr-2" /> {{ selectedCourse?.name || 'Exam' }}
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
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid"></div>
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

        <!-- Right: Student Details and Phases Card -->
        <div class="lg:w-48 bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
          <!-- Student Details -->
          <div class="mb-4">
            <h3 class="text-base font-semibold text-blue-500 mb-2">Student Details</h3>
            <div class="flex items-center space-x-4">
              <div v-if="studentPhoto" class="w-16 h-16 rounded-md overflow-hidden">
                <img
                  :src="studentPhoto"
                  alt="Student Photo"
                  class="w-full h-full object-cover"
                  @error="handleImageError('studentPhoto')"
                />
              </div>
              <div v-else class="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center text-sm text-gray-600">
                No Photo
              </div>
              <div>
                <p class="text-sm font-medium text-gray-700">Name: {{ user.name || 'N/A' }}</p>
                <p class="text-sm font-medium text-gray-700">Register Number: {{ user.registerNo || 'N/A' }}</p>
              </div>
            </div>
          </div>

          <!-- Phases -->
          <h3 class="text-base font-semibold text-blue-500 mb-4">Phases</h3>
          <div class="space-y-4">
            <!-- Phase 1 -->
            <div v-if="questions.phase1?.length">
              <h4 class="text-sm font-medium text-gray-700 mb-2">Phase 1</h4>
              <div class="flex flex-wrap gap-2">
                <div
                  v-for="(question, index) in questions.phase1"
                  :key="question?.id || `phase1-${index}`"
                  @click="question?.id && selectQuestion('phase1', index)"
                  class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold cursor-pointer transition-all duration-300"
                  :class="getCircleClass(question?.id)"
                >
                  {{ index + 1 }}
                </div>
              </div>
            </div>
            <!-- Phase 2 -->
            <div v-if="questions.phase2?.length">
              <h4 class="text-sm font-medium text-gray-700 mb-2">Phase 2</h4>
              <div class="flex flex-wrap gap-2">
                <div
                  v-for="(question, index) in questions.phase2"
                  :key="question?.id || `phase2-${index}`"
                  @click="question?.id && selectQuestion('phase2', index)"
                  class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold cursor-pointer transition-all duration-300"
                  :class="getCircleClass(question?.id)"
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
    </div>

    <!-- Results View -->
    <div v-else-if="showResultsView" class="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
      <h2 class="text-2xl font-bold text-blue-500 mb-4 flex items-center">
        <AcademicCapIcon class="w-6 h-6 mr-2" /> Exam Results
      </h2>
      <p v-if="hasMalpractice" class="text-red-600 mb-4 text-sm">
        Your Test Auto Evaluated Due to Malpractice. You cannot retake this exam.
      </p>
      <div v-if="examResults" class="space-y-4">
        <p class="text-sm font-semibold">Total Marks: {{ examResults.totalMarks || 0 }}</p>
        <div v-for="(result, index) in examResults.marks" :key="index" class="border-b border-gray-200 pb-2">
          <p class="text-sm font-medium">Question {{ index + 1 }}: {{ result.question }}</p>
          <p class="text-sm">Your Answer: {{ result.selectedAnswer || 'Not answered' }}</p>
          <p class="text-sm">Correct Answer: {{ result.correctAnswer }}</p>
          <p class="text-sm">Marks: {{ result.marks }} / {{ result.maxMarks }}</p>
        </div>
        <div class="flex justify-center space-x-2">
          <button
            @click="goBackToCourses"
            class="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 transition-all duration-200 text-sm"
          >
            Back to Courses
          </button>
        </div>
      </div>
      <div v-else class="text-center">
        <p class="text-gray-600 text-sm">No results available.</p>
      </div>
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
          Warning {{ malpracticeAttempts }} of 2. One more attempt will result in auto-evaluation of your exam!
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
</template>

<script>
import { AcademicCapIcon, PlayIcon, ExclamationCircleIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/solid';
import { useCourseFeatures } from './composables/courseFeatures';

export default {
  components: { AcademicCapIcon, PlayIcon, ExclamationCircleIcon, ExclamationTriangleIcon },
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
  setup(props, { emit }) {
    console.log('[Courses.vue] Courses prop:', props.courses); // Debug log
    const features = useCourseFeatures(props, emit);
    return {
      ...features,
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
  0% { transform: scale(1); opacity: 0.3; }
  50% { transform: scale(1.1); opacity: 0.5; }
  100% { transform: scale(1); opacity: 0.3; }
}

.mathjax-content { display: inline-block; min-height: 1.5em; }
img { height: auto; object-fit: contain; }
.scrollbar-hidden { -ms-overflow-style: none; scrollbar-width: none; }
.scrollbar-hidden::-webkit-scrollbar { display: none; }
button:hover { transform: translateY(-1px); }
.select-none { -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; }

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
  .w-\[300px\] { width: 160px; }
  .h-\[250px\] { height: 120px; }
  .w-\[60px\] { width: 50px; }
  table { font-size: 0.75rem; }
  th, td { padding: 0.5rem; }
  .max-w-md { width: 90%; }
  .timer-box { width: 100px; height: 50px; }
  .timer-display { font-size: 1rem; }
}
</style>
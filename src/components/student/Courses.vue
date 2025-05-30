<template>
  <div class="space-y-6 p-4 bg-blue text-indigo-600 relative h-screen" ref="container">
    <!-- Course List View -->
    <div v-if="!isExamStarted && !showResultsView">
      <h2 class="text-2xl font-bold transition-all duration-300 hover:text-blue-600 pb-4">My Courses</h2>
      <div v-if="!courses.length" class="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200 text-center">
        <p class="text-gray-600 text-sm">No courses assigned.</p>
      </div>
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
                      v-if="examStatus[course.id] === 'Exam Not Yet Started' || examStatus[course.id] === 'Exam Elapsed'"
                      disabled
                      class="bg-gray-300 text-gray-600 px-3 py-1 rounded-md text-sm cursor-not-allowed"
                    >
                      {{ examStatus[course.id] }}
                    </button>
                    <button
                      v-else-if="!course.hasCompleted && !course.hasMalpractice && !course.hasExited"
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
                      {{ examStatus[course.id] || (course.hasMalpractice ? 'Your Exam Auto Evaluated' : course.hasExited ? 'You Have Exited from Exam' : 'Exam completed successfully') }}
                    </span>
                    <button
                      @click="downloadHallTicketForStudent(course.id)"
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
    <div v-else-if="isExamStarted && !showResultsView" class="select-none fixed inset-0 bg-white z-40 flex flex-col">
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
      <div v-if="isQuestionsLoading" class="text-center flex-1 flex items-center justify-center">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid"></div>
        <p class="text-gray-600 mt-2 text-sm">Loading questions...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="questionsError" class="bg-red-50 p-4 rounded-lg shadow-sm border border-gray-200 text-center flex-1 flex items-center justify-center">
        <p class="text-red-600 text-sm">{{ questionsError }}</p>
      </div>

      <!-- No Questions -->
      <div v-else-if="questionsLoaded && !questions.phase1.length && !questions.phase2.length" class="text-center flex-1 flex items-center justify-center">
        <p class="text-gray-600 text-sm">No questions available for this course.</p>
      </div>

      <!-- Questions View -->
      <div v-else-if="questionsLoaded && (questions.phase1.length || questions.phase2.length)" class="flex flex-col lg:flex-row lg:space-x-4 flex-1 overflow-hidden" ref="questionList" :class="{ 'pointer-events-none': isExamPaused }">
        <!-- Left: Question View -->
        <div class="lg:flex-1 mb-4 lg:mb-0 overflow-y-auto">
          <div v-if="currentQuestion" class="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200 m-4">
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
                    'bg-gray-200 cursor-not-allowed': questionStatuses[currentQuestion.id] === 'submitted' || isExamPaused
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
                  :class="{ 'cursor-not-allowed': questionStatuses[currentQuestion.id] === 'submitted' || isExamPaused }"
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
                  :disabled="currentQuestionIndexInAll === 0 || isExamPaused"
                  class="bg-gray-200 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-300 transition-all duration-200 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  @click="navigateNext"
                  :disabled="currentQuestionIndexInAll === [...questions.phase1, ...questions.phase2].length - 1 || isExamPaused"
                  class="bg-gray-200 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-300 transition-all duration-200 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div class="flex space-x-2">
                <button
                  @click="markForReview(currentQuestion.id)"
                  :disabled="questionStatuses[currentQuestion.id] === 'submitted' || isExamPaused"
                  class="bg-orange-500 text-white px-3 py-1 rounded-md hover:bg-orange-600 transition-all duration-200 text-sm disabled:bg-orange-300 disabled:cursor-not-allowed"
                >
                  Review Later
                </button>
                <button
                  @click="submitAnswer(currentQuestion.id)"
                  :disabled="!selectedAnswers[currentQuestion.id] || questionStatuses[currentQuestion.id] === 'submitted' || isExamPaused"
                  class="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600 transition-all duration-200 text-sm disabled:bg-green-300 disabled:cursor-not-allowed"
                >
                  Submit Answer
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Student Details and Phases Card -->
        <div class="lg:w-48 bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200 h-fit">
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
          <h3 class="text-base font-semibold text-blue-500 mb-4">Phases</h3>
          <div class="space-y-4">
            <div v-if="questions.phase1?.length">
              <h4 class="text-sm font-medium text-gray-700 mb-2">Phase 1</h4>
              <div class="flex flex-wrap gap-2">
                <div
                  v-for="(question, index) in questions.phase1"
                  :key="question?.id || `phase1-${index}`"
                  @click="question?.id && selectQuestion('phase1', index)"
                  class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold cursor-pointer transition-all duration-300"
                  :class="[getCircleClass(question?.id), { 'cursor-not-allowed': isExamPaused }]"
                >
                  {{ index + 1 }}
                </div>
              </div>
            </div>
            <div v-if="questions.phase2?.length">
              <h4 class="text-sm font-medium text-gray-700 mb-2">Phase 2</h4>
              <div class="flex flex-wrap gap-2">
                <div
                  v-for="(question, index) in questions.phase2"
                  :key="question?.id || `phase2-${index}`"
                  @click="question?.id && selectQuestion('phase2', index)"
                  class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold cursor-pointer transition-all duration-300"
                  :class="[getCircleClass(question?.id), { 'cursor-not-allowed': isExamPaused }]"
                >
                  {{ index + 1 }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Submit Exam Button -->
      <div v-if="questionsLoaded && (questions.phase1.length || questions.phase2.length)" class="mt-4 flex justify-center space-x-2 p-4 bg-gray-50 border-t border-gray-200">
        <button
          @click="showExitModal"
          :disabled="isExamPaused"
          class="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition-all duration-200 text-sm disabled:bg-red-300 disabled:cursor-not-allowed"
        >
          Exit Exam
        </button>
        <button
          @click="submitExam"
          :disabled="!canSubmit || isExamPaused"
          class="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 transition-all duration-200 text-sm disabled:bg-blue-300 disabled:cursor-not-allowed"
        >
          Submit Exam
        </button>
      </div>

      <!-- Calculator Button and UI -->
      <div v-if="isExamStarted && !showResultsView" class="fixed bottom-4 left-4 z-50">
        <button
          @click.stop="toggleCalculator"
          :disabled="isExamPaused"
          class="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 transition-all duration-200 flex items-center space-x-1 text-sm disabled:bg-blue-300 disabled:cursor-not-allowed"
          title="Toggle Calculator"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6M9 10h6M9 13h6m-3-6v12m6-9H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2z"></path>
          </svg>
          <span>Calculator</span>
        </button>
        <div
          v-if="isCalculatorOpen"
          class="absolute bottom-14 left-0 w-72 bg-gray-800 text-white p-4 rounded-lg shadow-lg calculator"
        >
          <div class="mb-2">
            <input
              v-model="display"
              class="w-full bg-gray-900 text-right text-white p-2 rounded-md text-sm"
              readonly
            />
          </div>
          <div class="grid grid-cols-5 gap-2">
            <button @click="memoryClear" class="bg-gray-600 p-2 rounded-md hover:bg-gray-700">MC</button>
            <button @click="memoryRecall" class="bg-gray-600 p-2 rounded-md hover:bg-gray-700">MR</button>
            <button @click="memoryStore" class="bg-gray-600 p-2 rounded-md hover:bg-gray-700">MS</button>
            <button @click="clear" class="bg-red-500 p-2 rounded-md hover:bg-red-600 col-span-2">C</button>
            <button @click="scientificFunction('sin')" class="bg-gray-600 p-2 rounded-md hover:bg-gray-700">sin</button>
            <button @click="scientificFunction('cos')" class="bg-gray-600 p-2 rounded-md hover:bg-gray-700">cos</button>
            <button @click="scientificFunction('tan')" class="bg-gray-600 p-2 rounded-md hover:bg-gray-700">tan</button>
            <button @click="scientificFunction('asin')" class="bg-gray-600 p-2 rounded-md hover:bg-gray-700">sin⁻¹</button>
            <button @click="scientificFunction('acos')" class="bg-gray-600 p-2 rounded-md hover:bg-gray-700">cos⁻¹</button>
            <button @click="scientificFunction('atan')" class="bg-gray-600 p-2 rounded-md hover:bg-gray-700">tan⁻¹</button>
            <button @click="scientificFunction('pi')" class="bg-gray-600 p-2 rounded-md hover:bg-gray-700">π</button>
            <button @click="scientificFunction('e')" class="bg-gray-600 p-2 rounded-md hover:bg-gray-700">e</button>
            <button @click="scientificFunction('log')" class="bg-gray-600 p-2 rounded-md hover:bg-gray-700">log</button>
            <button @click="scientificFunction('ln')" class="bg-gray-600 p-2 rounded-md hover:bg-gray-700">ln</button>
            <button @click="scientificFunction('sqrt')" class="bg-gray-600 p-2 rounded-md hover:bg-gray-700">√</button>
            <button @click="scientificFunction('square')" class="bg-gray-600 p-2 rounded-md hover:bg-gray-700">x²</button>
            <button @click="scientificFunction('cube')" class="bg-gray-600 p-2 rounded-md hover:bg-gray-700">x³</button>
            <button @click="scientificFunction('factorial')" class="bg-gray-600 p-2 rounded-md hover:bg-gray-700">n!</button>
            <button @click="scientificFunction('abs')" class="bg-gray-600 p-2 rounded-md hover:bg-gray-700">|x|</button>
            <button @click="appendNumber('7')" class="bg-gray-700 p-2 rounded-md hover:bg-gray-800">7</button>
            <button @click="appendNumber('8')" class="bg-gray-700 p-2 rounded-md hover:bg-gray-800">8</button>
            <button @click="appendNumber('9')" class="bg-gray-700 p-2 rounded-md hover:bg-gray-800">9</button>
            <button @click="setOperation('/')" class="bg-blue-500 p-2 rounded-md hover:bg-blue-600">/</button>
            <button @click="scientificFunction('inv')" class="bg-gray-600 p-2 rounded-md hover:bg-gray-700">1/x</button>
            <button @click="appendNumber('4')" class="bg-gray-700 p-2 rounded-md hover:bg-gray-800">4</button>
            <button @click="appendNumber('5')" class="bg-gray-700 p-2 rounded-md hover:bg-gray-800">5</button>
            <button @click="appendNumber('6')" class="bg-gray-700 p-2 rounded-md hover:bg-gray-800">6</button>
            <button @click="setOperation('*')" class="bg-blue-500 p-2 rounded-md hover:bg-blue-600">×</button>
            <button @click="scientificFunction('exp')" class="bg-gray-600 p-2 rounded-md hover:bg-gray-700">e^x</button>
            <button @click="appendNumber('1')" class="bg-gray-700 p-2 rounded-md hover:bg-gray-800">1</button>
            <button @click="appendNumber('2')" class="bg-gray-700 p-2 rounded-md hover:bg-gray-800">2</button>
            <button @click="appendNumber('3')" class="bg-gray-700 p-2 rounded-md hover:bg-gray-800">3</button>
            <button @click="setOperation('-')" class="bg-blue-500 p-2 rounded-md hover:bg-blue-600">-</button>
            <button @click="setOperation('^')" class="bg-blue-500 p-2 rounded-md hover:bg-blue-600">^</button>
            <button @click="appendNumber('0')" class="bg-gray-700 p-2 rounded-md hover:bg-gray-800 col-span-2">0</button>
            <button @click="appendDecimal" class="bg-gray-700 p-2 rounded-md hover:bg-gray-800">.</button>
            <button @click="setOperation('+')" class="bg-blue-500 p-2 rounded-md hover:bg-blue-600">+</button>
            <button @click="calculate" class="bg-green-500 p-2 rounded-md hover:bg-green-600">=</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Results View -->
    <div v-else-if="showResultsView" class="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
      <h2 class="text-2xl font-bold text-blue-500 mb-4 flex items-center">
        <AcademicCapIcon class="w-6 h-6 mr-2" /> Exam Results
      </h2>
      <p v-if="hasMalpractice" class="text-red-600 mb-4 text-sm">
        Your Exam Auto Evaluated Due to Malpractice. You cannot retake this exam.
      </p>
      <div v-if="examResults" class="space-y-4">
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
    <div v-if="showMalpracticeWarning" class="fixed inset-0 bg-red-500 bg-opacity-75 flex items-center justify-center z-[1000] pointer-events-auto">
      <div class="bg-white p-6 rounded-lg shadow-lg border border-gray-200 w-full max-w-md text-center">
        <h3 class="text-lg font-semibold text-red-600 mb-4 flex items-center justify-center">
          <ExclamationTriangleIcon class="w-8 h-8 mr-2" /> Warning: Suspicious Activity Detected
        </h3>
        <p class="text-gray-700 mb-4 text-sm">
          This is warning {{ Math.max(malpracticeAttempts.right_click, malpracticeAttempts.screenshot_key, malpracticeAttempts.other) }} of 2. One more attempt will result in auto-evaluation of your exam. Please stay focused on the exam window.
        </p>
        <button
          @click="dismissMalpracticeWarning"
          class="malpractice-dismiss-button bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-all duration-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pointer-events-auto cursor-pointer"
          @mousedown="logButtonClick"
        >
          Okay, I Understand
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { AcademicCapIcon, PlayIcon, ExclamationCircleIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/solid';
import { useCourseFeatures } from './composables/courseFeatures';
import { useCalculator } from './composables/useCalculator.js';

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
    console.log('[Courses.vue] Courses prop:', props.courses);

    const courseFeatures = useCourseFeatures(props, emit);
    const calculator = useCalculator();

    // Debug function to log button click
    const logButtonClick = () => {
      console.log('Okay button mousedown event triggered at', new Date().toISOString());
      console.log('Button state:', {
        isExamPaused: courseFeatures.isExamPaused.value,
        showMalpracticeWarning: courseFeatures.showMalpracticeWarning.value,
      });
    };

    return {
      ...courseFeatures,
      ...calculator,
      logButtonClick,
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

.calculator {
  transition: transform 0.3s ease, opacity 0.3s ease;
  transform-origin: bottom;
}

.calculator[v-if="isCalculatorOpen"] {
  transform: translateY(0);
  opacity: 1;
}

.calculator:not([v-if="isCalculatorOpen"]) {
  transform: translateY(20px);
  opacity: 0;
}

.calculator button {
  font-size: 0.75rem;
  transition: all 0.2s ease;
}

.calculator button:hover {
  transform: scale(1.05);
}

/* Ensure the malpractice dismiss button is fully interactive and not styled as disabled */
.malpractice-dismiss-button {
  background-color: #3b82f6 !important; /* Blue-500 */
  color: white !important;
  cursor: pointer !important;
  opacity: 1 !important;
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.malpractice-dismiss-button:hover {
  background-color: #2563eb !important; /* Blue-600 */
  transform: translateY(-1px);
}

.malpractice-dismiss-button:active {
  transform: translateY(0);
}

.malpractice-dismiss-button:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
}

/* Ensure disabled styles do not apply to this button */
.malpractice-dismiss-button:disabled {
  background-color: #3b82f6 !important;
  opacity: 1 !important;
  cursor: pointer !important;
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
  .w-\[300px\] { width: 160px; }
  .h-\[250px\] { height: 120px; }
  .w-\[60px\] { width: 50px; }
  table { font-size: 0.75rem; }
  th, td { padding: 0.5rem; }
  .max-w-md { width: 90%; }
  .timer-box { width: 100px; height: 50px; }
  .timer-display { font-size: 1rem; }
  .calculator {
    width: 90%;
    max-width: 280px;
    left: 0;
  }
  .calculator button {
    font-size: 0.65rem;
    padding: 0.5rem;
  }
}
</style>
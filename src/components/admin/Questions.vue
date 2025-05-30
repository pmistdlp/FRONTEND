<template>
  <div class="space-y-6 p-4 bg-white text-gray-800">
    <div v-if="isLoading" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
      <div class="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid"></div>
      <p class="text-white ml-4">Processing...</p>
    </div>

    <div v-if="selectedCourse">
      <h2 class="text-2xl font-bold transition-all duration-300 hover:text-blue-600">
        Questions for {{ selectedCourse.name || 'Selected Course' }}
      </h2>

      <div class="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
        <h3 class="text-base font-semibold text-blue-500 mb-4">
          Manage Questions ({{ questions.length }} Total)
        </h3>

        <!-- Integrated Create/Edit Form -->
        <div class="mb-6">
          <h4 class="text-sm font-semibold text-blue-500 mb-3">{{ isEditing ? 'Edit Question' : 'Add Question' }}</h4>
          <form @submit.prevent="isEditing ? confirmEditQuestion() : createQuestion()" class="space-y-4">
            <div class="grid grid-cols-1 gap-4">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Course Outcome (CO)</label>
                <select v-model="question.coNumber" required 
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 text-sm"
                        @change="updateKLevelOptions">
                  <option value="" disabled>Select CO</option>
                  <option v-for="co in coDetails" :key="co.coNumber" :value="co.coNumber">
                    {{ co.coNumber }} - {{ co.coDescription }} (K{{ co.kLevel }})
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">K-Level (1-{{ selectedCOMaxKLevel }})</label>
                <select v-model.number="question.kLevel" required 
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 text-sm">
                  <option value="" disabled>Select K-Level</option>
                  <option v-for="level in kLevelOptions" :key="level" :value="level">K{{ level }}</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Question (Use LaTeX for formulas, e.g., \[ E = mc^2 \])</label>
                <input v-model="question.question" placeholder="Enter question (e.g., What is \[ E = mc^2 \]?)"
                       required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Question Image (Optional, max 1MB)</label>
                <input type="file" accept="image/jpeg,image/png" @change="handleImageUpload($event, 'questionImage')"
                       class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
                <img v-if="question.questionImagePreview" :src="question.questionImagePreview" alt="Question Image Preview"
                     class="mt-2 max-w-xs h-auto rounded-md" />
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-medium text-gray-700 mb-1">Option 1</label>
                  <input v-model="question.option1" placeholder="Option 1 (e.g., \[ mc^2 \])" required 
                         class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 text-sm" />
                  <label class="block text-xs font-medium text-gray-700 mt-2 mb-1">Option 1 Image (Optional, max 1MB)</label>
                  <input type="file" accept="image/jpeg,image/png" @change="handleImageUpload($event, 'option1Image')"
                         class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
                  <img v-if="question.option1ImagePreview" :src="question.option1ImagePreview" alt="Option 1 Image Preview"
                       class="mt-2 max-w-xs h-auto rounded-md" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-700 mb-1">Option 2</label>
                  <input v-model="question.option2" placeholder="Option 2" required 
                         class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 text-sm" />
                  <label class="block text-xs font-medium text-gray-700 mt-2 mb-1">Option 2 Image (Optional, max 1MB)</label>
                  <input type="file" accept="image/jpeg,image/png" @change="handleImageUpload($event, 'option2Image')"
                         class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
                  <img v-if="question.option2ImagePreview" :src="question.option2ImagePreview" alt="Option 2 Image Preview"
                       class="mt-2 max-w-xs h-auto rounded-md" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-700 mb-1">Option 3</label>
                  <input v-model="question.option3" placeholder="Option 3" required 
                         class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 text-sm" />
                  <label class="block text-xs font-medium text-gray-700 mt-2 mb-1">Option 3 Image (Optional, max 1MB)</label>
                  <input type="file" accept="image/jpeg,image/png" @change="handleImageUpload($event, 'option3Image')"
                         class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
                  <img v-if="question.option3ImagePreview" :src="question.option3ImagePreview" alt="Option 3 Image Preview"
                       class="mt-2 max-w-xs h-auto rounded-md" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-700 mb-1">Option 4</label>
                  <input v-model="question.option4" placeholder="Option 4" required 
                         class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 text-sm" />
                  <label class="block text-xs font-medium text-gray-700 mt-2 mb-1">Option 4 Image (Optional, max 1MB)</label>
                  <input type="file" accept="image/jpeg,image/png" @change="handleImageUpload($event, 'option4Image')"
                         class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
                  <img v-if="question.option4ImagePreview" :src="question.option4ImagePreview" alt="Option 4 Image Preview"
                       class="mt-2 max-w-xs h-auto rounded-md" />
                </div>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-medium text-gray-700 mb-1">Correct Answer</label>
                  <select v-model="question.answer" required 
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 text-sm">
                    <option value="" disabled>Select answer</option>
                    <option value="option1">{{ question.option1 || 'Option 1' }}</option>
                    <option value="option2">{{ question.option2 || 'Option 2' }}</option>
                    <option value="option3">{{ question.option3 || 'Option 3' }}</option>
                    <option value="option4">{{ question.option4 || 'Option 4' }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-700 mb-1">Weightage</label>
                  <input v-model="question.weightage" type="number" placeholder="Weightage" required 
                         class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 text-sm" />
                </div>
              </div>
            </div>
            <div class="flex space-x-2">
              <button type="submit" 
                      class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-all duration-200 text-sm">
                {{ isEditing ? 'Update Question' : 'Add Question' }}
              </button>
              <button v-if="isEditing" @click="cancelEdit" type="button"
                      class="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-all duration-200 text-sm">
                Cancel
              </button>
              <label class="bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-600 transition-all duration-200 cursor-pointer text-sm">
                Upload Questions
                <input type="file" ref="fileInput" @change="handleFileUpload" accept=".csv" class="hidden" />
              </label>
              <button @click="downloadTemplate" type="button"
                      class="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-all duration-200 text-sm">
                Download Template
              </button>
            </div>
          </form>
        </div>

        <!-- Bulk Delete Controls -->
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center">
            <input type="checkbox" v-model="selectAll" @change="toggleSelectAll"
                   class="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
            <label class="text-sm font-medium text-gray-700">Select All</label>
          </div>
          <button v-if="selectedQuestions.length > 0" @click="showBulkDeletePopup"
                  class="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-all duration-200 text-sm">
            Delete Selected ({{ selectedQuestions.length }})
          </button>
        </div>

        <!-- Question List with CO, K-Level, Images, and Checkboxes -->
        <div class="space-y-4" ref="questionList">
          <div v-for="(q, index) in questions" :key="q.id" 
               class="flex bg-white rounded-md shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
            <div class="flex-shrink-0 w-12 bg-indigo-500 text-white rounded-l-md flex items-center justify-center">
              <input type="checkbox" v-model="selectedQuestions" :value="q.id"
                     class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
            </div>
            <div class="flex-1 p-4">
              <div class="flex justify-between items-start">
                <div class="flex-1">
                  <div class="text-gray-800 font-medium break-words">
                    <span class="mathjax-content">{{ q.question }}</span>
                    <img v-if="baseURL && q.questionImage" :src="`${baseURL}/${q.questionImage}`" 
                         alt="Question Image" class="mt-2 max-w-xs h-auto rounded-md" />
                  </div>
                  <p class="text-gray-600 text-sm mt-1">CO: {{ q.coNumber }} | K-Level: K{{ q.kLevel }}</p>
                  <ul class="mt-2 text-gray-600 text-sm space-y-2">
                    <li class="inline-block">
                      <span :class="{ 'correct-answer': q.answer === 'option1' }" 
                            class="inline-block px-3 py-1 rounded-md mathjax-content">{{ q.option1 }}</span>
                      <img v-if="baseURL && q.option1Image" :src="`${baseURL}/${q.option1Image}`" 
                           alt="Option 1 Image" class="mt-2 max-w-xs h-auto rounded-md" />
                    </li>
                    <li class="inline-block">
                      <span :class="{ 'correct-answer': q.answer === 'option2' }" 
                            class="inline-block px-3 py-1 rounded-md mathjax-content">{{ q.option2 }}</span>
                      <img v-if="baseURL && q.option2Image" :src="`${baseURL}/${q.option2Image}`" 
                           alt="Option 2 Image" class="mt-2 max-w-xs h-auto rounded-md" />
                    </li>
                    <li class="inline-block">
                      <span :class="{ 'correct-answer': q.answer === 'option3' }" 
                            class="inline-block px-3 py-1 rounded-md mathjax-content">{{ q.option3 }}</span>
                      <img v-if="baseURL && q.option3Image" :src="`${baseURL}/${q.option3Image}`" 
                           alt="Option 3 Image" class="mt-2 max-w-xs h-auto rounded-md" />
                    </li>
                    <li class="inline-block">
                      <span :class="{ 'correct-answer': q.answer === 'option4' }" 
                            class="inline-block px-3 py-1 rounded-md mathjax-content">{{ q.option4 }}</span>
                      <img v-if="baseURL && q.option4Image" :src="`${baseURL}/${q.option4Image}`" 
                           alt="Option 4 Image" class="mt-2 max-w-xs h-auto rounded-md" />
                    </li>
                  </ul>
                  <div class="mt-2">
                    <p class="text-blue-600 font-semibold">Weightage: {{ q.weightage }}</p>
                  </div>
                </div>
                <div class="flex space-x-2 ml-4">
                  <div class="relative group">
                    <button @click="editQuestion(q)" class="text-blue-500 hover:text-blue-700 transition-colors">
                      <PencilIcon class="w-4 h-4" />
                    </button>
                    <span class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                      Edit Question
                    </span>
                  </div>
                  <div class="relative group">
                    <button @click="showDeleteQuestionPopup(q.id)" class="text-red-500 hover:text-red-700 transition-colors">
                      <TrashIcon class="w-4 h-4" />
                    </button>
                    <span class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                      Delete Question
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-if="questions.length === 0" class="text-center py-4 text-gray-500">
            No questions available for this course.
          </div>
        </div>

        <!-- Delete Question Popup (Single Question) -->
        <div v-if="showDeleteQuestionModal" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white p-4 rounded-lg shadow-lg border border-gray-200 w-full max-w-md">
            <h3 class="text-base font-semibold text-red-500 mb-4">Confirm Deletion</h3>
            <p class="text-gray-800 mb-4 text-sm">Are you sure you want to delete this question? This action cannot be undone.</p>
            <div class="flex justify-end space-x-2">
              <button @click="confirmDeleteQuestion" 
                      class="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-all duration-200 text-sm">
                Delete
              </button>
              <button @click="closeDeleteQuestionModal" 
                      class="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-all duration-200 text-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>

        <!-- Bulk Delete Confirmation Popup -->
        <div v-if="showBulkDeleteModal" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white p-4 rounded-lg shadow-lg border border-gray-200 w-full max-w-md">
            <h3 class="text-base font-semibold text-red-500 mb-4">Confirm Bulk Deletion</h3>
            <p class="text-gray-800 mb-4 text-sm">
              Are you sure you want to delete {{ selectedQuestions.length }} selected question(s)? This action cannot be undone.
            </p>
            <div class="flex justify-end space-x-2">
              <button @click="confirmBulkDelete" 
                      class="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-all duration-200 text-sm">
                Delete
              </button>
              <button @click="closeBulkDeleteModal" 
                      class="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-all duration-200 text-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>

        <!-- Upload Confirmation Popup -->
        <div v-if="showUploadPopup" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white p-4 rounded-lg shadow-lg border border-gray-200 w-full max-w-[90vw] max-h-[80vh] overflow-y-auto" ref="uploadPreview">
            <h3 class="text-base font-semibold text-green-500 mb-4">Questions Extracted from File</h3>
            <div class="space-y-4">
              <div v-for="(q, index) in extractedQuestions" :key="index" 
                   class="flex bg-gray-50 rounded-md shadow-sm border border-gray-100">
                <div class="flex-shrink-0 w-12 bg-indigo-500 text-white rounded-l-md flex items-center justify-center">
                  <span class="text-sm font-semibold">{{ index + 1 }}</span>
                </div>
                <div class="flex-1 p-4">
                  <div class="text-gray-800 font-medium break-words">
                    <span class="mathjax-content">{{ q.question }}</span>
                    <img v-if="baseURL && q.questionImage" :src="q.questionImage" alt="Question Image" class="mt-2 max-w-xs h-auto rounded-md" />
                  </div>
                  <p class="text-gray-600 text-sm mb-2">CO: {{ q.coNumber }} | K-Level: K{{ q.kLevel }}</p>
                  <ul class="text-gray-600 text-sm space-y-2">
                    <li class="inline-block">
                      <span :class="{ 'correct-answer': q.answer === 'option1' }" 
                            class="inline-block px-3 py-1 rounded-md mathjax-content">{{ q.option1 }}</span>
                      <img v-if="baseURL && q.option1Image" :src="q.option1Image" alt="Option 1 Image" 
                           class="mt-2 max-w-xs h-auto rounded-md" />
                    </li>
                    <li class="inline-block">
                      <span :class="{ 'correct-answer': q.answer === 'option2' }" 
                            class="inline-block px-3 py-1 rounded-md mathjax-content">{{ q.option2 }}</span>
                      <img v-if="baseURL && q.option2Image" :src="q.option2Image" alt="Option 2 Image" 
                           class="mt-2 max-w-xs h-auto rounded-md" />
                    </li>
                    <li class="inline-block">
                      <span :class="{ 'correct-answer': q.answer === 'option3' }" 
                            class="inline-block px-3 py-1 rounded-md mathjax-content">{{ q.option3 }}</span>
                      <img v-if="baseURL && q.option3Image" :src="q.option3Image" alt="Option 3 Image" 
                           class="mt-2 max-w-xs h-auto rounded-md" />
                    </li>
                    <li class="inline-block">
                      <span :class="{ 'correct-answer': q.answer === 'option4' }" 
                            class="inline-block px-3 py-1 rounded-md mathjax-content">{{ q.option4 }}</span>
                      <img v-if="baseURL && q.option4Image" :src="q.option4Image" alt="Option 4 Image" 
                           class="mt-2 max-w-xs h-auto rounded-md" />
                    </li>
                  </ul>
                  <p class="text-blue-600 font-semibold mt-2">Weightage: {{ q.weightage }}</p>
                </div>
              </div>
            </div>
            <div class="flex justify-end space-x-2 mt-4">
              <button @click="confirmUploadQuestions" :disabled="isUploading" 
                      class="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 disabled:bg-gray-400 transition-all duration-200 text-sm">
                {{ isUploading ? 'Uploading...' : 'Confirm Upload' }}
              </button>
              <button @click="cancelUpload" :disabled="isUploading" 
                      class="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 disabled:bg-gray-300 transition-all duration-200 text-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="text-center py-4 text-gray-500">
      Please select a course to manage questions.
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import apiConfig from '@/config/apiConfig';
import { defineComponent } from 'vue';
import { PencilIcon, TrashIcon } from '@heroicons/vue/24/solid';

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

export default defineComponent({
  name: 'Questions',
  components: { PencilIcon, TrashIcon },
  props: {
    selectedCourse: { type: Object, default: null },
    questions: { type: Array, default: () => [] },
    user: { type: Object, required: true, default: () => ({}) },
  },
  data() {
    return {
      baseURL: '',
      api: null,
      question: { 
        coNumber: '', 
        kLevel: '', 
        question: '', 
        questionImage: null,
        questionImagePreview: null,
        option1: '', 
        option1Image: null,
        option1ImagePreview: null,
        option2: '', 
        option2Image: null,
        option2ImagePreview: null,
        option3: '', 
        option3Image: null,
        option3ImagePreview: null,
        option4: '', 
        option4Image: null,
        option4ImagePreview: null,
        answer: '', 
        weightage: 1 
      },
      coDetails: [], // Store fetched COs
      isLoading: false,
      isUploading: false,
      isEditing: false,
      showDeleteQuestionModal: false,
      showBulkDeleteModal: false,
      showUploadPopup: false,
      questionIdToDelete: null,
      selectedQuestions: [],
      selectAll: false,
      file: null,
      extractedQuestions: [],
      mathJaxLoaded: false,
      mathJaxFailed: false,
      mutationObserver: null,
      debouncedTypesetMathJax: debounce(() => {
        this.typesetMathJax();
      }, 300),
    };
  },
  computed: {
    selectedCOMaxKLevel() {
      if (!Array.isArray(this.coDetails) || !this.question.coNumber) {
        return 14;
      }
      const selectedCO = this.coDetails.find(co => co.coNumber === this.question.coNumber);
      return selectedCO ? selectedCO.kLevel : 14;
    },
    kLevelOptions() {
      const maxK = this.selectedCOMaxKLevel;
      return Array.from({ length: maxK }, (_, i) => i + 1);
    },
  },
  watch: {
    selectedCourse(newVal, oldVal) {
      if (newVal && (!oldVal || newVal.id !== oldVal.id)) {
        this.fetchCOs(newVal.id);
        this.question.coNumber = '';
        this.question.kLevel = '';
        this.selectedQuestions = [];
        this.selectAll = false;
        this.$nextTick(() => this.debouncedTypesetMathJax());
      }
    },
    questions: {
      handler() {
        this.selectedQuestions = this.selectedQuestions.filter(id => 
          this.questions.some(q => q.id === id)
        );
        this.selectAll = this.selectedQuestions.length === this.questions.length && this.questions.length > 0;
        this.$nextTick(() => this.debouncedTypesetMathJax());
      },
      deep: true,
    },
    extractedQuestions: {
      handler() {
        this.$nextTick(() => this.debouncedTypesetMathJax());
      },
      deep: true,
    },
    selectedQuestions(newVal) {
      this.selectAll = newVal.length === this.questions.length && this.questions.length > 0;
    },
  },
  async created() {
    try {
      this.baseURL = await apiConfig.getBaseURL();
      this.api = await this.getApiClient();
    } catch (error) {
      console.error('Failed to fetch base URL:', error);
      this.baseURL = 'http://localhost:3000';
      this.api = axios.create({
        baseURL: this.baseURL,
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (this.selectedCourse) {
      this.fetchCOs(this.selectedCourse.id);
      this.$emit('fetchQuestions', this.selectedCourse.id);
    }
  },
  methods: {
    async getApiClient() {
      const baseURL = this.baseURL || (await apiConfig.getBaseURL());
      return axios.create({
        baseURL,
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' },
      });
    },
    async fetchCOs(courseId) {
      this.isLoading = true;
      try {
        const response = await this.api.get(`/api/questions/${courseId}/cos`);
        this.coDetails = response.data.coDetails || [];
        if (response.data.coCount !== this.coDetails.length) {
          console.warn(`CO count mismatch: expected ${response.data.coCount}, got ${this.coDetails.length}`);
        }
      } catch (error) {
        console.error('Error fetching COs:', error.response?.data || error.message);
        alert(`Failed to fetch COs: ${error.response?.data.error || error.message}`);
        this.coDetails = [];
      } finally {
        this.isLoading = false;
      }
    },
    updateKLevelOptions() {
      this.question.kLevel = '';
      this.$nextTick(() => this.debouncedTypesetMathJax());
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
          alert('Failed to render formulas. Displaying raw text. Please check your internet connection.');
        }
      }
    },
    handleImageUpload(event, field) {
      const file = event.target.files[0];
      if (!file) return;

      if (file.size > 1024 * 1024) {
        alert('Image size must be less than 1MB.');
        event.target.value = '';
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        alert('Only JPEG and PNG images are allowed.');
        event.target.value = '';
        return;
      }

      this.question[field] = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.question[`${field}Preview`] = e.target.result;
      };
      reader.readAsDataURL(file);
    },
    async createQuestion() {
      this.isLoading = true;
      try {
        const formData = new FormData();
        formData.append('courseId', this.selectedCourse.id);
        formData.append('coNumber', this.question.coNumber);
        formData.append('kLevel', this.question.kLevel);
        formData.append('question', this.question.question);
        formData.append('option1', this.question.option1);
        formData.append('option2', this.question.option2);
        formData.append('option3', this.question.option3);
        formData.append('option4', this.question.option4);
        formData.append('answer', this.question.answer);
        formData.append('weightage', this.question.weightage);
        formData.append('userType', 'admin');
        formData.append('userId', this.user.id);

        if (this.question.questionImage) formData.append('questionImage', this.question.questionImage);
        if (this.question.option1Image) formData.append('option1Image', this.question.option1Image);
        if (this.question.option2Image) formData.append('option2Image', this.question.option2Image);
        if (this.question.option3Image) formData.append('option3Image', this.question.option3Image);
        if (this.question.option4Image) formData.append('option4Image', this.question.option4Image);

        await this.api.post('/api/questions', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        this.$emit('fetchQuestions', this.selectedCourse.id);
        this.$emit('fetchCourseHistory');
        this.resetForm();
        this.$nextTick(() => this.debouncedTypesetMathJax());
      } catch (error) {
        console.error('Error creating question:', error.response?.data || error.message);
        alert(`Failed to create question: ${error.response?.data.error || error.message}`);
      } finally {
        this.isLoading = false;
      }
    },
    editQuestion(question) {
      this.isEditing = true;
      this.question = {
        ...question,
        questionImage: null,
        questionImagePreview: question.questionImage ? `${this.baseURL}/${question.questionImage}` : null,
        option1Image: null,
        option1ImagePreview: question.option1Image ? `${this.baseURL}/${question.option1Image}` : null,
        option2Image: null,
        option2ImagePreview: question.option2Image ? `${this.baseURL}/${question.option2Image}` : null,
        option3Image: null,
        option3ImagePreview: question.option3Image ? `${this.baseURL}/${question.option3Image}` : null,
        option4Image: null,
        option4ImagePreview: question.option4Image ? `${this.baseURL}/${question.option4Image}` : null,
      };
      this.$nextTick(() => this.debouncedTypesetMathJax());
    },
    async confirmEditQuestion() {
      this.isLoading = true;
      try {
        const formData = new FormData();
        formData.append('courseId', this.selectedCourse.id);
        formData.append('coNumber', this.question.coNumber);
        formData.append('kLevel', this.question.kLevel);
        formData.append('question', this.question.question);
        formData.append('option1', this.question.option1);
        formData.append('option2', this.question.option2);
        formData.append('option3', this.question.option3);
        formData.append('option4', this.question.option4);
        formData.append('answer', this.question.answer);
        formData.append('weightage', this.question.weightage);
        formData.append('userType', 'admin');
        formData.append('userId', this.user.id);

        if (this.question.questionImage) formData.append('questionImage', this.question.questionImage);
        if (this.question.option1Image) formData.append('option1Image', this.question.option1Image);
        if (this.question.option2Image) formData.append('option2Image', this.question.option2Image);
        if (this.question.option3Image) formData.append('option3Image', this.question.option3Image);
        if (this.question.option4Image) formData.append('option4Image', this.question.option4Image);

        await this.api.put(`/api/questions/${this.question.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        this.$emit('fetchQuestions', this.selectedCourse.id);
        this.$emit('fetchCourseHistory');
        this.resetForm();
        this.$nextTick(() => this.debouncedTypesetMathJax());
      } catch (error) {
        console.error('Error updating question:', error.response?.data || error.message);
        alert(`Failed to update question: ${error.response?.data.error || error.message}`);
      } finally {
        this.isLoading = false;
      }
    },
    cancelEdit() {
      this.resetForm();
      this.$nextTick(() => this.debouncedTypesetMathJax());
    },
    resetForm() {
      this.isEditing = false;
      this.question = { 
        coNumber: '', 
        kLevel: '', 
        question: '', 
        questionImage: null,
        questionImagePreview: null,
        option1: '', 
        option1Image: null,
        option1ImagePreview: null,
        option2: '', 
        option2Image: null,
        option2ImagePreview: null,
        option3: '', 
        option3Image: null,
        option3ImagePreview: null,
        option4: '', 
        option4Image: null,
        option4ImagePreview: null,
        answer: '', 
        weightage: 1 
      };
    },
    showDeleteQuestionPopup(id) {
      this.questionIdToDelete = id;
      this.showDeleteQuestionModal = true;
    },
    async confirmDeleteQuestion() {
      this.isLoading = true;
      try {
        await this.api.delete(`/api/questions/${this.questionIdToDelete}`, {
          data: { userType: 'admin', userId: this.user.id, courseId: this.selectedCourse.id }
        });
        this.$emit('fetchQuestions', this.selectedCourse.id);
        this.$emit('fetchCourseHistory');
        this.closeDeleteQuestionModal();
        this.$nextTick(() => this.debouncedTypesetMathJax());
      } catch (error) {
        console.error('Error deleting question:', error.response?.data || error.message);
        alert(`Failed to delete question: ${error.response?.data.error || error.message}`);
      } finally {
        this.isLoading = false;
      }
    },
    closeDeleteQuestionModal() {
      this.showDeleteQuestionModal = false;
      this.questionIdToDelete = null;
    },
    toggleSelectAll() {
      if (this.selectAll) {
        this.selectedQuestions = this.questions.map(q => q.id);
      } else {
        this.selectedQuestions = [];
      }
    },
    showBulkDeletePopup() {
      this.showBulkDeleteModal = true;
    },
    async confirmBulkDelete() {
      this.isLoading = true;
      try {
        await this.api.delete('/api/questions/bulk', {
          data: {
            questionIds: this.selectedQuestions,
            userType: 'admin',
            userId: this.user.id,
            courseId: this.selectedCourse.id
          }
        });
        this.$emit('fetchQuestions', this.selectedCourse.id);
        this.$emit('fetchCourseHistory');
        this.selectedQuestions = [];
        this.selectAll = false;
        this.closeBulkDeleteModal();
        this.$nextTick(() => this.debouncedTypesetMathJax());
      } catch (error) {
        console.error('Error deleting questions:', error.response?.data || error.message);
        alert(`Failed to delete questions: ${error.response?.data.error || error.message}`);
      } finally {
        this.isLoading = false;
      }
    },
    closeBulkDeleteModal() {
      this.showBulkDeleteModal = false;
    },
    async handleFileUpload(event) {
      this.file = event.target.files[0];
      if (!this.file) return;
      if (!this.file.name.endsWith('.csv')) {
        alert('Please upload a valid CSV file.');
        return;
      }

      this.isLoading = true;
      const formData = new FormData();
      formData.append('file', this.file);
      formData.append('courseId', this.selectedCourse.id);

      try {
        const response = await this.api.post('/api/questions/bulk-upload/preview', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        this.extractedQuestions = response.data.questions;
        this.showUploadPopup = true;
        this.$nextTick(() => this.debouncedTypesetMathJax());
      } catch (error) {
        console.error('Error uploading file:', error.response?.data || error.message);
        let errorMessage = `Failed to process file: ${error.response?.data.error || error.message}`;
        if (error.response?.data.details) {
          errorMessage += '\nDetails:\n' + error.response.data.details.join('\n');
        }
        alert(errorMessage);
      } finally {
        this.isLoading = false;
      }
    },
    async confirmUploadQuestions() {
      if (this.isUploading) return;

      this.isUploading = true;
      try {
        const response = await this.api.post('/api/questions/bulk-upload/confirm', {
          courseId: this.selectedCourse.id,
          userType: 'admin',
          userId: this.user.id,
          questions: this.extractedQuestions
        });
        alert(response.data.message);
        this.$emit('fetchQuestions', this.selectedCourse.id);
        this.$emit('fetchCourseHistory');
        this.showUploadPopup = false;
        this.file = null;
        this.$refs.fileInput.value = '';
        this.$nextTick(() => this.debouncedTypesetMathJax());
      } catch (error) {
        console.error('Error confirming upload:', error.response?.data || error.message);
        alert(`Failed to upload questions: ${error.response?.data.error || error.message}`);
      } finally {
        this.isUploading = false;
      }
    },
    cancelUpload() {
      this.showUploadPopup = false;
      this.extractedQuestions = [];
      this.file = null;
      this.$refs.fileInput.value = '';
      this.$nextTick(() => this.debouncedTypesetMathJax());
    },
    downloadTemplate() {
      const csvContent = `CO Number,K-Level,Question,Question Image,Option A,Option A Image,Option B,Option B Image,Option C,Option C Image,Option D,Option D Image,Correct Answer,Weightage
# Example: CO1,3,What is the formula for kinetic energy? \\[ KE = \\frac{1}{2}mv^2 \\],,mv,,mv^2,,\\[ \\frac{1}{2}mv^2 \\],,2mv,,option3,1
# Example: CO2,2,Solve \\[ x^2 - 4 = 0 \\],,\\[ x = 2 \\],,\\[ x = -2 \\],,\\[ x = 0 \\],,\\[ x = 1 \\],,option1,2
# Note: Use LaTeX for formulas, e.g., \\[ E = mc^2 \\] for display math or \\( x^2 \\) for inline math
# Image fields are optional and should contain file paths or URLs if used
# Correct Answer must be one of: option1, option2, option3, option4
# K-Level must be a number between 1 and the max K-Level for the CO
# Weightage must be a positive number
`;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'question_template.csv';
      link.click();
      URL.revokeObjectURL(link.href);
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
          alert('Failed to load MathJax after multiple attempts. Formulas will be displayed as raw text.');
        }
      };
      document.head.appendChild(script);
    },
    setupMutationObserver() {
      const targetNode = this.$refs.questionList;
      const uploadNode = this.$refs.uploadPreview;

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

      if (targetNode) {
        this.mutationObserver.observe(targetNode, config);
      }
      if (uploadNode) {
        this.mutationObserver.observe(uploadNode, config);
      }
    },
  },
  mounted() {
    this.loadMathJax();
    this.$nextTick(() => {
      this.setupMutationObserver();
    });
  },
  beforeUnmount() {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }
  },
  updated() {
    if (this.mathJaxLoaded && !this.mathJaxFailed) {
      this.$nextTick(() => this.debouncedTypesetMathJax());
    }
  },
});
</script>

<style scoped>
.list-enter-active, .list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from, .list-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

input, select {
  transition: all 0.2s ease;
}
input:focus, select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 1px #3b82f6;
}

button:hover {
  transform: translateY(-1px);
}

.break-words {
  word-break: break-word;
}

.group {
  position: relative;
}

.correct-answer {
  background-color: #d1fae5; 
  border: 1px solid #10b981;
  padding: 0.5rem 1rem;
  margin-right: 0.5rem;
  border-radius: 0.375rem;
}

.w-12 {
  width: 3rem;
}

.hover\:shadow-md:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.mathjax-content {
  display: inline-block;
  min-height: 1.5em;
}

@media (max-width: 640px) {
  .w-12 {
    width: 2.5rem;
  }
  .text-sm {
    font-size: 0.875rem;
  }
  .p-4 {
    padding: 0.75rem;
  }
}
</style>
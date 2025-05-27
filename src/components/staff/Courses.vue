<!-- client/src/components/staff/Courses.vue -->
<template>
    <div class="space-y-8 p-6 bg-white text-gray-800">
      <!-- Loading Overlay -->
      <div v-if="isLoading" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
        <div class="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid"></div>
      </div>
  
      <h2 class="text-3xl font-extrabold transition-all duration-300 hover:text-blue-600">Course Management</h2>
  
      <!-- Course List -->
      <div class="bg-gray-50 p-6 rounded-xl shadow-md border border-gray-200 transition-all duration-300 hover:shadow-lg">
        <h3 class="text-lg font-semibold text-blue-500 mb-4 transition-colors duration-300 hover:text-blue-700">Course List</h3>
        <div class="overflow-x-auto">
          <table class="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead>
              <tr class="bg-gray-100">
                <th class="py-3 px-4 text-left text-gray-600 font-semibold border-b border-gray-200">Name</th>
                <th class="py-3 px-4 text-left text-gray-600 font-semibold border-b border-gray-200">Questions</th>
                <th class="py-3 px-4 text-left text-gray-600 font-semibold border-b border-gray-200">Actions</th>
              </tr>
            </thead>
            <transition-group name="list" tag="tbody">
              <tr v-for="c in courses" :key="c.id" class="hover:bg-gray-100 transition-all duration-300">
                <td class="py-3 px-4 border-b border-gray-200 text-gray-800 cursor-pointer hover:text-blue-700" @click="$emit('selectCourse', c)">
                  {{ c.name }}
                </td>
                <td class="py-3 px-4 border-b border-gray-200 text-gray-800">{{ c.noOfQuestions }} Qs</td>
                <td class="py-3 px-4 border-b border-gray-200 flex space-x-3">
                  <!-- Staff can only manage questions, not edit courses directly -->
                </td>
              </tr>
            </transition-group>
          </table>
        </div>
      </div>
  
      <!-- Selected Course Questions -->
      <div v-if="selectedCourse" class="bg-gray-50 p-6 rounded-xl shadow-md border border-gray-200 transition-all duration-300 hover:shadow-lg">
        <h3 class="text-lg font-semibold text-blue-500 mb-4 transition-colors duration-300 hover:text-blue-700">{{ selectedCourse.name }} - Questions</h3>
        <button v-if="questions.length < selectedCourse.noOfQuestions" @click="showAddQuestionForm = true" 
                class="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 shadow-md">
          Add Question
        </button>
        <p v-else class="text-red-500 font-medium mt-4">Max Questions Reached</p>
  
        <!-- Add Question Form (Shown in Modal) -->
        <div v-if="showAddQuestionForm" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white p-6 rounded-lg shadow-lg border border-gray-200 w-full max-w-md transition-all duration-300">
            <h3 class="text-lg font-semibold text-blue-500 mb-4">Add New Question</h3>
            <form @submit.prevent="createQuestion" class="space-y-4">
              <input v-model="question.question" placeholder="Question" required 
                     class="bg-white border border-gray-300 p-3 rounded-lg w-full text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300" />
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input v-model="question.option1" placeholder="Option 1" required 
                       class="bg-white border border-gray-300 p-3 rounded-lg w-full text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300" />
                <input v-model="question.option2" placeholder="Option 2" required 
                       class="bg-white border border-gray-300 p-3 rounded-lg w-full text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300" />
                <input v-model="question.option3" placeholder="Option 3" required 
                       class="bg-white border border-gray-300 p-3 rounded-lg w-full text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300" />
                <input v-model="question.option4" placeholder="Option 4" required 
                       class="bg-white border border-gray-300 p-3 rounded-lg w-full text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300" />
              </div>
              <select v-model="question.answer" required 
                      class="bg-white border border-gray-300 p-3 rounded-lg w-full text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300">
                <option value="" disabled class="text-gray-400">Select Correct Answer</option>
                <option value="option1" class="text-gray-800">{{ question.option1 || 'Option 1' }}</option>
                <option value="option2" class="text-gray-800">{{ question.option2 || 'Option 2' }}</option>
                <option value="option3" class="text-gray-800">{{ question.option3 || 'Option 3' }}</option>
                <option value="option4" class="text-gray-800">{{ question.option4 || 'Option 4' }}</option>
              </select>
              <div class="flex space-x-4 mt-4">
                <button type="submit" class="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 shadow-md">
                  Save Question
                </button>
                <button type="button" @click="cancelAddQuestion" class="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-all duration-300 transform hover:scale-105 shadow-md">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
  
        <div class="overflow-x-auto mt-4">
          <table class="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead>
              <tr class="bg-gray-100">
                <th class="py-3 px-4 text-left text-gray-600 font-semibold border-b border-gray-200">Question</th>
                <th class="py-3 px-4 text-left text-gray-600 font-semibold border-b border-gray-200">Answer</th>
                <th class="py-3 px-4 text-left text-gray-600 font-semibold border-b border-gray-200">Actions</th>
              </tr>
            </thead>
            <transition-group name="list" tag="tbody">
              <tr v-for="q in questions" :key="q.id" class="hover:bg-gray-100 transition-all duration-300">
                <td class="py-3 px-4 border-b border-gray-200 text-gray-800">{{ q.question }}</td>
                <td class="py-3 px-4 border-b border-gray-200 text-gray-800">{{ q.answer }}</td>
                <td class="py-3 px-4 border-b border-gray-200 flex space-x-3">
                  <button @click="showEditQuestionPopup(q)" class="text-blue-500 hover:text-blue-700 transition-colors duration-300 transform hover:scale-110">
                    <PencilIcon class="w-5 h-5" />
                  </button>
                  <button @click="showDeleteQuestionPopup(q.id)" class="text-red-500 hover:text-red-700 transition-colors duration-300 transform hover:scale-110">
                    <TrashIcon class="w-5 h-5" />
                  </button>
                </td>
              </tr>
            </transition-group>
          </table>
        </div>
      </div>
  
      <!-- Edit Question Popup (Modal) -->
      <div v-if="showEditQuestionModal" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white p-6 rounded-lg shadow-lg border border-gray-200 w-full max-w-md transition-all duration-300">
          <h3 class="text-lg font-semibold text-blue-500 mb-4">Edit Question</h3>
          <form @submit.prevent="confirmEditQuestion" class="space-y-4">
            <input v-model="editQuestionData.question" placeholder="Question" required 
                   class="bg-white border border-gray-300 p-3 rounded-lg w-full text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300" />
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input v-model="editQuestionData.option1" placeholder="Option 1" required 
                     class="bg-white border border-gray-300 p-3 rounded-lg w-full text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300" />
              <input v-model="editQuestionData.option2" placeholder="Option 2" required 
                     class="bg-white border border-gray-300 p-3 rounded-lg w-full text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300" />
              <input v-model="editQuestionData.option3" placeholder="Option 3" required 
                     class="bg-white border border-gray-300 p-3 rounded-lg w-full text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300" />
              <input v-model="editQuestionData.option4" placeholder="Option 4" required 
                     class="bg-white border border-gray-300 p-3 rounded-lg w-full text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300" />
            </div>
            <select v-model="editQuestionData.answer" required 
                    class="bg-white border border-gray-300 p-3 rounded-lg w-full text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300">
              <option value="" disabled class="text-gray-400">Select Correct Answer</option>
              <option value="option1" class="text-gray-800">{{ editQuestionData.option1 || 'Option 1' }}</option>
              <option value="option2" class="text-gray-800">{{ editQuestionData.option2 || 'Option 2' }}</option>
              <option value="option3" class="text-gray-800">{{ editQuestionData.option3 || 'Option 3' }}</option>
              <option value="option4" class="text-gray-800">{{ editQuestionData.option4 || 'Option 4' }}</option>
            </select>
            <div class="flex space-x-4 mt-4">
              <button type="submit" class="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 shadow-md">
                Save Changes
              </button>
              <button type="button" @click="closeEditQuestionModal" class="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-all duration-300 transform hover:scale-105 shadow-md">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
  
      <!-- Delete Question Popup (Modal) -->
      <div v-if="showDeleteQuestionModal" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white p-6 rounded-lg shadow-lg border border-gray-200 w-full max-w-md transition-all duration-300">
          <h3 class="text-lg font-semibold text-red-500 mb-4">Confirm Deletion</h3>
          <p class="text-gray-800 mb-4">Are you sure you want to delete this question? This action cannot be undone.</p>
          <div class="flex space-x-4">
            <button @click="confirmDeleteQuestion" class="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-all duration-300 transform hover:scale-105 shadow-md">
              Delete
            </button>
            <button @click="closeDeleteQuestionModal" class="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-all duration-300 transform hover:scale-105 shadow-md">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  import { defineComponent } from 'vue';
  import { PencilIcon, TrashIcon } from '@heroicons/vue/24/solid';
  
  export default defineComponent({
    name: 'StaffCourses',
    components: { PencilIcon, TrashIcon },
    props: {
      user: {
        type: Object,
        required: true,
        default: () => ({}),
      },
      courses: {
        type: Array,
        default: () => [],
      },
      selectedCourse: {
        type: Object,
        default: null,
      },
      questions: {
        type: Array,
        default: () => [],
      },
    },
    data() {
      return {
        question: { question: '', option1: '', option2: '', option3: '', option4: '', answer: '' },
        isLoading: false,
        showAddQuestionForm: false,
        showEditQuestionModal: false,
        showDeleteQuestionModal: false,
        editQuestionData: {},
        questionIdToDelete: null,
      };
    },
    methods: {
      async createQuestion() {
        this.isLoading = true;
        try {
          const questionData = { ...this.question, courseId: this.selectedCourse.id, userType: 'staff', userId: this.user.id };
          await axios.post('http://localhost:3000/api/questions', questionData);
          this.$emit('fetchQuestions', this.selectedCourse.id); // Fetch questions immediately to update the list
          this.question = { question: '', option1: '', option2: '', option3: '', option4: '', answer: '' };
          this.showAddQuestionForm = false;
        } catch (error) {
          console.error('Error creating question:', error);
          alert('Failed to create question. Please try again.');
        } finally {
          this.isLoading = false;
        }
      },
      showEditQuestionPopup(question) {
        this.editQuestionData = { ...question };
        this.showEditQuestionModal = true;
      },
      async confirmEditQuestion() {
        this.isLoading = true;
        try {
          await axios.put(`http://localhost:3000/api/questions/${this.editQuestionData.id}`, this.editQuestionData);
          this.$emit('fetchQuestions', this.selectedCourse.id); // Fetch questions to refresh the list
          this.closeEditQuestionModal();
        } catch (error) {
          console.error('Error updating question:', error);
          alert('Failed to update question. Please try again.');
        } finally {
          this.isLoading = false;
        }
      },
      closeEditQuestionModal() {
        this.showEditQuestionModal = false;
        this.editQuestionData = {};
      },
      showDeleteQuestionPopup(id) {
        this.questionIdToDelete = id;
        this.showDeleteQuestionModal = true;
      },
      async confirmDeleteQuestion() {
        this.isLoading = true;
        try {
          await axios.delete(`http://localhost:3000/api/questions/${this.questionIdToDelete}`, {
            data: { userType: 'staff', userId: this.user.id, courseId: this.selectedCourse.id }
          });
          this.$emit('fetchQuestions', this.selectedCourse.id); // Fetch questions to refresh the list
          this.closeDeleteQuestionModal();
        } catch (error) {
          console.error('Error deleting question:', error);
          alert('Failed to delete question. Please try again.');
        } finally {
          this.isLoading = false;
        }
      },
      closeDeleteQuestionModal() {
        this.showDeleteQuestionModal = false;
        this.questionIdToDelete = null;
      },
      cancelAddQuestion() {
        this.showAddQuestionForm = false;
        this.question = { question: '', option1: '', option2: '', option3: '', option4: '', answer: '' };
      },
      async fetchCourses() {
        this.isLoading = true;
        try {
          const { data } = await axios.get('http://localhost:3000/api/courses');
          this.$emit('fetchCourses', data);
        } catch (error) {
          console.error('Error fetching courses:', error);
          alert('Failed to fetch courses. Please try again.');
        } finally {
          this.isLoading = false;
        }
      },
    },
    created() {
      this.$emit('fetchCourses');
    },
  });
  </script>
  
  <style scoped>
  /* Vue transition for the list */
  .list-enter-active, .list-leave-active {
    transition: all 0.3s ease;
  }
  .list-enter-from, .list-leave-to {
    opacity: 0;
    transform: translateY(10px);
  }
  .list-move {
    transition: transform 0.3s ease;
  }
  
  /* Modal transition */
  .modal-enter-active, .modal-leave-active {
    transition: all 0.3s ease;
  }
  .modal-enter-from, .modal-leave-to {
    opacity: 0;
    transform: translateY(20px);
  }
  
  /* Ensure Tailwind classes don’t interfere with transitions */
  .list-item {
    transition: all 0.3s ease;
  }
  </style>
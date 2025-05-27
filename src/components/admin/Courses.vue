<template>
  <div class="space-y-6 p-4 bg-white text-gray-800">
    <!-- Loading Overlay -->
    <div v-if="isLoading" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
      <div class="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid"></div>
      <p class="text-white ml-4">Processing...</p>
    </div>

    <h2 class="text-2xl font-bold transition-all duration-300 hover:text-blue-600">Course Dashboard</h2>

    <!-- Course Form (Create/Edit) -->
    <div class="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
      <h3 class="text-base font-semibold text-blue-500 mb-4">{{ isEditing ? 'Edit Course' : 'New Course' }}</h3>
      <form @submit.prevent="isEditing ? confirmEditCourse() : createCourse()" class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div class="relative">
            <label for="course-name" class="block text-xs font-medium text-gray-700 mb-1">Course Name</label>
            <input
              id="course-name"
              v-model="course.name"
              placeholder="Enter course name"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 text-sm"
            />
          </div>
          <div class="relative">
            <label for="course-code" class="block text-xs font-medium text-gray-700 mb-1">Course Code (optional)</label>
            <input
              id="course-code"
              v-model="course.course_code"
              placeholder="Enter course code"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 text-sm"
            />
          </div>
          <div class="relative">
            <label for="learning-platform" class="block text-xs font-medium text-gray-700 mb-1">Learning Platform</label>
            <select
              id="learning-platform"
              v-model="course.learning_platform"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 text-sm"
            >
              <option value="" disabled>Select Platform</option>
              <option value="NPTEL">NPTEL</option>
              <option value="NPTEL+">NPTEL+</option>
              <option value="SWAYAM">SWAYAM</option>
              <option value="ULEKTZ">ULEKTZ</option>
            </select>
          </div>
          <div class="relative">
            <label for="exam-date" class="block text-xs font-medium text-gray-700 mb-1">Exam Date (optional)</label>
            <input
              id="exam-date"
              v-model="course.examDate"
              type="date"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 text-sm"
            />
          </div>
          <div class="relative">
            <label for="exam-time" class="block text-xs font-medium text-gray-700 mb-1">Exam Time (IST, optional)</label>
            <input
              id="exam-time"
              v-model="course.examTime"
              type="time"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 text-sm"
            />
          </div>
          <div class="relative">
            <label for="exam-question-count" class="block text-xs font-medium text-gray-700 mb-1">Questions For Exam</label>
            <input
              id="exam-question-count"
              v-model.number="course.examQuestionCount"
              type="number"
              placeholder="Enter number"
              min="0"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 text-sm"
            />
          </div>
          <div class="relative">
            <label for="co-count" class="block text-xs font-medium text-gray-700 mb-1">Number of Course Outcomes (COs)</label>
            <input
              id="co-count"
              v-model.number="course.coCount"
              type="number"
              placeholder="Enter number of COs"
              min="0"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        <!-- Dynamic CO Fields with K-level -->
        <div v-if="course.coCount > 0" class="space-y-4">
          <h4 class="text-sm font-medium text-gray-700">Course Outcomes</h4>
          <div v-for="(co, index) in course.coDetails" :key="index" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="relative">
              <label :for="'co-number-' + index" class="block text-xs font-medium text-gray-700 mb-1">CO Number (e.g., CO1)</label>
              <input
                :id="'co-number-' + index"
                v-model="course.coDetails[index].coNumber"
                placeholder="e.g., CO1"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 text-sm"
              />
            </div>
            <div class="relative">
              <label :for="'co-description-' + index" class="block text-xs font-medium text-gray-700 mb-1">CO Description</label>
              <input
                :id="'co-description-' + index"
                v-model="course.coDetails[index].coDescription"
                placeholder="Enter CO description"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 text-sm"
              />
            </div>
            <div class="relative">
              <label :for="'k-level-' + index" class="block text-xs font-medium text-gray-700 mb-1">K-Level (1-6)</label>
              <select
                :id="'k-level-' + index"
                v-model.number="course.coDetails[index].kLevel"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 text-sm"
              >
                <option value="" disabled>Select K-Level</option>
                <option v-for="level in 6" :key="level" :value="level">K{{ level }}</option>
              </select>
            </div>
          </div>
        </div>

        <div class="flex space-x-2">
          <button
            type="submit"
            class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-all duration-200 text-sm"
          >
            {{ isEditing ? 'Update Course' : 'Create Draft' }}
          </button>
          <button
            v-if="isEditing"
            @click="cancelEdit"
            type="button"
            class="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-all duration-200 text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>

    <!-- Course List -->
    <div class="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200 max-h-[400px] overflow-y-auto scrollbar-hidden">
      <h3 class="text-base font-semibold text-blue-500 mb-4">Course List</h3>
      <table class="min-w-full bg-white border border-gray-200 rounded-md text-sm">
        <thead class="sticky top-0 bg-gray-100">
          <tr>
            <th class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">Name</th>
            <th class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">Course Code</th>
            <th class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">Platform</th>
            <th class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">Exam Date</th>
            <th class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">Exam Time</th>
            <th class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">Questions Count</th>
            <th class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">Exam Questions</th>
            <th class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">CO Count</th>
            <th class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">Status</th>
            <th class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">Actions</th>
          </tr>
        </thead>
        <transition-group name="list" tag="tbody">
          <tr v-for="c in courses" :key="c.id" class="hover:bg-gray-50 transition-all duration-200">
            <td class="py-2 px-3 border-b border-gray-200">
              <button @click="selectCourse(c)" 
                      class="w-full text-left bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 
                             transition-all duration-200 flex items-center justify-between group relative">
                <span>{{ c.name }}</span>
                <ArrowRightIcon class="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  View Questions
                </span>
              </button>
            </td>
            <td class="py-2 px-3 border-b border-gray-200">{{ c.course_code || 'N/A' }}</td>
            <td class="py-2 px-3 border-b border-gray-200">{{ c.learning_platform }}</td>
            <td class="py-2 px-3 border-b border-gray-200">{{ c.examDate || 'N/A' }}</td>
            <td class="py-2 px-3 border-b border-gray-200">{{ c.examTime ? `${c.examTime} IST` : 'N/A' }}</td>
            <td class="py-2 px-3 border-b border-gray-200">{{ c.totalQuestions }} Qs</td>
            <td class="py-2 px-3 border-b border-gray-200">{{ c.examQuestionCount || 'N/A' }}</td>
            <td class="py-2 px-3 border-b border-gray-200">{{ c.coCount || 0 }}</td>
            <td class="py-2 px-3 border-b border-gray-200">{{ c.isDraft ? 'Draft' : 'Pushed' }}</td>
            <td class="py-2 px-3 border-b border-gray-200 flex flex-wrap gap-2">
              <button @click="editCourse(c)" 
                      class="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-all duration-200 flex items-center space-x-1 text-sm">
                <PencilIcon class="w-4 h-4" />
                <span>Edit</span>
              </button>
              <button @click="showDeletePopup(c.id)" 
                      class="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-700 transition-all duration-200 flex items-center space-x-1 text-sm">
                <TrashIcon class="w-4 h-4" />
                <span>Delete</span>
              </button>
              <button v-if="c.isDraft" @click="showPushPopup(c)" 
                      class="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-700 transition-all duration-200 flex items-center space-x-1 text-sm">
                <PlayIcon class="w-4 h-4" />
                <span>Push</span>
              </button>
              <button v-else @click="showRevokePopup(c)" 
                      class="bg-orange-500 text-white px-3 py-1 rounded-md hover:bg-orange-700 transition-all duration-200 flex items-center space-x-1 text-sm">
                <ArrowUturnLeftIcon class="w-4 h-4" />
                <span>Revoke</span>
              </button>
              <button v-if="!c.isDraft && !c.isRegistrationOpen" @click="openRegistration(c)" 
                      class="bg-purple-500 text-white px-3 py-1 rounded-md hover:bg-purple-700 transition-all duration-200 flex items-center space-x-1 text-sm">
                <UserPlusIcon class="w-4 h-4" />
                <span>Open Registration</span>
              </button>
              <button v-if="!c.isDraft && c.isRegistrationOpen" @click="closeRegistration(c)" 
                      class="bg-purple-600 text-white px-3 py-1 rounded-md hover:bg-purple-800 transition-all duration-200 flex items-center space-x-1 text-sm">
                <UserMinusIcon class="w-4 h-4" />
                <span>Close Registration</span>
              </button>
            </td>
          </tr>
        </transition-group>
      </table>
    </div>

    <!-- Push Course Popup -->
    <div v-if="showPushCourseModal" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-4 rounded-lg shadow-lg border border-gray-200 w-full max-w-3xl">
        <h3 class="text-base font-semibold text-green-500 mb-4">Push Course for Enrollment</h3>
        <form @submit.prevent="confirmPushCourse" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Course Name</label>
              <input v-model="pushCourseData.name" readonly class="w-full px-3 py-2 bg-gray-100 border rounded-md text-sm" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Course Code</label>
              <input v-model="pushCourseData.course_code" readonly class="w-full px-3 py-2 bg-gray-100 border rounded-md text-sm" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Learning Platform</label>
              <input v-model="pushCourseData.learning_platform" readonly class="w-full px-3 py-2 bg-gray-100 border rounded-md text-sm" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Exam Date</label>
              <input v-model="pushCourseData.examDate" type="date" required class="w-full px-3 py-2 border rounded-md text-sm" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Number of Course Outcomes (COs)</label>
              <input v-model.number="pushCourseData.coCount" type="number" readonly class="w-full px-3 py-2 bg-gray-100 border rounded-md text-sm" />
            </div>
          </div>
          <div class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Exam Time (IST)</label>
              <input v-model="pushCourseData.examTime" type="time" required class="w-full px-3 py-2 border rounded-md text-sm" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Questions For Exam</label>
              <input v-model="pushCourseData.examQuestionCount" type="number" required class="w-full px-3 py-2 border rounded-md text-sm" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Total Exam Marks</label>
              <input v-model="pushCourseData.examMarks" type="number" required class="w-full px-3 py-2 border rounded-md text-sm" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Weightage Distribution</label>
              <div class="grid grid-cols-2 gap-2">
                <input v-model.number="weightageDistribution[1]" type="number" placeholder="Weight 1" 
                       class="w-full px-3 py-2 border rounded-md text-sm" />
                <input v-model.number="weightageDistribution[2]" type="number" placeholder="Weight 2" 
                       class="w-full px-3 py-2 border rounded-md text-sm" />
              </div>
            </div>
          </div>
          <div class="md:col-span-2 flex justify-end space-x-2 mt-4">
            <button type="submit" class="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-all duration-200 text-sm">
              Push Course
            </button>
            <button type="button" @click="closePushCourseModal" 
                    class="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-all duration-200 text-sm">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Revoke Course Popup -->
    <div v-if="showRevokeCourseModal" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-4 rounded-lg shadow-lg border border-gray-200 w-full max-w-md">
        <h3 class="text-base font-semibold text-orange-500 mb-4">Revoke Course</h3>
        <p class="text-gray-800 mb-4 text-sm">Are you sure you want to revoke this course to draft status? This will make it unavailable for enrollment.</p>
        <div class="flex justify-end space-x-2">
          <button @click="confirmRevokeCourse" 
                  class="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-all duration-200 text-sm">
            Revoke
          </button>
          <button @click="closeRevokeCourseModal" 
                  class="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-all duration-200 text-sm">
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Course Popup -->
    <div v-if="showDeleteCourseModal" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-4 rounded-lg shadow-lg border border-gray-200 w-full max-w-md">
        <h3 class="text-base font-semibold text-red-500 mb-4">Confirm Deletion</h3>
        <p class="text-gray-800 mb-4 text-sm">Are you sure you want to delete this course? This action cannot be undone.</p>
        <div class="flex justify-end space-x-2">
          <button @click="confirmDeleteCourse" 
                  class="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-all duration-200 text-sm">
            Delete
          </button>
          <button @click="closeDeleteCourseModal" 
                  class="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-all duration-200 text-sm">
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
import apiConfig from '@/config/apiConfig'; // Adjust the import path as needed
import { PencilIcon, TrashIcon, PlayIcon, ArrowUturnLeftIcon, ArrowRightIcon, UserPlusIcon, UserMinusIcon } from '@heroicons/vue/24/solid';

export default {
  name: 'Courses',
  components: { PencilIcon, TrashIcon, PlayIcon, ArrowUturnLeftIcon, ArrowRightIcon, UserPlusIcon, UserMinusIcon },
  props: {
    courses: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      isLoading: false,
      isEditing: false,
      course: {
        name: '',
        course_code: '',
        learning_platform: '',
        examDate: '',
        examTime: '',
        examQuestionCount: '',
        coCount: 0,
        coDetails: [],
      },
      pushCourseData: {},
      weightageDistribution: { 1: '', 2: '' },
      showPushCourseModal: false,
      revokeCourseData: {},
      showRevokeCourseModal: false,
      courseIdToDelete: null,
      showDeleteCourseModal: false,
    };
  },
  watch: {
    'course.coCount'(newCount) {
      if (!Number.isInteger(newCount) || newCount < 0) {
        this.course.coCount = 0;
        this.course.coDetails = [];
        return;
      }
      if (this.course.coDetails.length > newCount) {
        this.course.coDetails = this.course.coDetails.slice(0, newCount);
      } else {
        while (this.course.coDetails.length < newCount) {
          this.course.coDetails.push({ coNumber: '', coDescription: '', kLevel: '' });
        }
      }
    },
  },
  methods: {
    async createCourse() {
      if (this.course.coCount > 0) {
        for (const co of this.course.coDetails) {
          if (!co.coNumber || !co.coDescription || !co.kLevel) {
            alert('Please fill all CO Number, CO Description, and K-Level fields.');
            return;
          }
        }
        const coNumbers = this.course.coDetails.map((co) => co.coNumber.toUpperCase());
        if (new Set(coNumbers).size !== coNumbers.length) {
          alert('CO Numbers must be unique (e.g., CO1, CO2).');
          return;
        }
      }
      this.isLoading = true;
      try {
        const client = await this.getApiClient();
        const courseData = {
          ...this.course,
          coDetails: this.course.coCount > 0 ? this.course.coDetails : [],
          examTime: this.course.examTime || null, // Ensure null if empty
        };
        const response = await client.post('/api/courses', courseData);
        alert(response.data.message);
        this.$emit('fetchCourses');
        this.course = {
          name: '',
          course_code: '',
          learning_platform: '',
          examDate: '',
          examTime: '',
          examQuestionCount: '',
          coCount: 0,
          coDetails: [],
        };
      } catch (error) {
        console.error('Error creating course:', error);
        const errorMessage = error.response?.data?.error || 'Failed to create course. Please check your input and try again.';
        alert(errorMessage);
      } finally {
        this.isLoading = false;
      }
    },
    editCourse(course) {
      this.isEditing = true;
      this.course = {
        ...course,
        course_code: course.course_code || '',
        learning_platform: course.learning_platform,
        coDetails: Array.isArray(course.coDetails) ? course.coDetails : course.coDetails ? JSON.parse(course.coDetails) : [],
        examTime: course.examTime || '', // Ensure examTime is a string
      };
    },
    async confirmEditCourse() {
      if (this.course.coCount > 0) {
        for (const co of this.course.coDetails) {
          if (!co.coNumber || !co.coDescription || !co.kLevel) {
            alert('Please fill all CO Number, CO Description, and K-Level fields.');
            return;
          }
        }
        const coNumbers = this.course.coDetails.map((co) => co.coNumber.toUpperCase());
        if (new Set(coNumbers).size !== coNumbers.length) {
          alert('CO Numbers must be unique (e.g., CO1, CO2).');
          return;
        }
      }
      this.isLoading = true;
      try {
        const client = await this.getApiClient();
        const courseData = {
          ...this.course,
          coDetails: this.course.coCount > 0 ? this.course.coDetails : [],
          examTime: this.course.examTime || null, // Ensure null if empty
        };
        const response = await client.put(`/api/courses/${this.course.id}`, courseData);
        alert(response.data.message);
        this.$emit('fetchCourses');
        this.cancelEdit();
      } catch (error) {
        console.error('Error updating course:', error);
        const errorMessage = error.response?.data?.error || 'Failed to update course. Please try again.';
        alert(errorMessage);
      } finally {
        this.isLoading = false;
      }
    },
    cancelEdit() {
      this.isEditing = false;
      this.course = {
        name: '',
        course_code: '',
        learning_platform: '',
        examDate: '',
        examTime: '',
        examQuestionCount: '',
        coCount: 0,
        coDetails: [],
      };
    },
    showPushPopup(course) {
      this.pushCourseData = {
        ...course,
        course_code: course.course_code || '',
        learning_platform: course.learning_platform,
        coDetails: Array.isArray(course.coDetails) ? course.coDetails : course.coDetails ? JSON.parse(course.coDetails) : [],
        examTime: course.examTime || '', // Ensure examTime is a string
      };
      this.weightageDistribution = { 1: '', 2: '' };
      this.showPushCourseModal = true;
    },
    async confirmPushCourse() {
      if (!this.pushCourseData.examTime) {
        alert('Exam Time is required to push the course.');
        return;
      }
      this.isLoading = true;
      try {
        const client = await this.getApiClient();
        await client.put(`/api/courses/${this.pushCourseData.id}`, {
          name: this.pushCourseData.name,
          course_code: this.pushCourseData.course_code,
          learning_platform: this.pushCourseData.learning_platform,
          examDate: this.pushCourseData.examDate,
          examTime: this.pushCourseData.examTime,
          examQuestionCount: this.pushCourseData.examQuestionCount,
          examMarks: this.pushCourseData.examMarks,
          coCount: this.pushCourseData.coCount,
          coDetails: this.pushCourseData.coCount > 0 ? this.pushCourseData.coDetails : [],
          weightageDistribution: this.weightageDistribution,
          isDraft: 0,
        });
        alert('Course successfully pushed for test');
        this.$emit('fetchCourses');
        this.closePushCourseModal();
      } catch (error) {
        console.error('Error pushing course:', error);
        const errorMessage = error.response?.data?.error || 'Failed to push course. Please try again.';
        alert(errorMessage);
      } finally {
        this.isLoading = false;
      }
    },
    closePushCourseModal() {
      this.showPushCourseModal = false;
      this.pushCourseData = {};
      this.weightageDistribution = { 1: '', 2: '' };
    },
    showRevokePopup(course) {
      this.revokeCourseData = {
        ...course,
        course_code: course.course_code || '',
        learning_platform: course.learning_platform,
        coDetails: Array.isArray(course.coDetails) ? course.coDetails : course.coDetails ? JSON.parse(course.coDetails) : [],
        examTime: course.examTime || '', // Ensure examTime is a string
      };
      this.showRevokeCourseModal = true;
    },
    async confirmRevokeCourse() {
      this.isLoading = true;
      try {
        const client = await this.getApiClient();
        await client.put(`/api/courses/${this.revokeCourseData.id}`, {
          ...this.revokeCourseData,
          coDetails: this.revokeCourseData.coCount > 0 ? this.revokeCourseData.coDetails : [],
          isDraft: 1,
          isRegistrationOpen: 0,
          examTime: this.revokeCourseData.examTime || null, // Ensure null if empty
        });
        alert('Course revoked to draft');
        this.$emit('fetchCourses');
        this.closeRevokeCourseModal();
      } catch (error) {
        console.error('Error revoking course:', error);
        const errorMessage = error.response?.data?.error || 'Failed to revoke course. Please try again.';
        alert(errorMessage);
      } finally {
        this.isLoading = false;
      }
    },
    closeRevokeCourseModal() {
      this.showRevokeCourseModal = false;
      this.revokeCourseData = {};
    },
    showDeletePopup(id) {
      this.courseIdToDelete = id;
      this.showDeleteCourseModal = true;
    },
    async confirmDeleteCourse() {
      this.isLoading = true;
      try {
        const client = await this.getApiClient();
        await client.delete(`/api/courses/${this.courseIdToDelete}`);
        alert('Course deleted');
        this.$emit('fetchCourses');
        this.closeDeleteCourseModal();
      } catch (error) {
        console.error('Error deleting course:', error);
        const errorMessage = error.response?.data?.error || 'Failed to delete course. Please try again.';
        alert(errorMessage);
      } finally {
        this.isLoading = false;
      }
    },
    closeDeleteCourseModal() {
      this.showDeleteCourseModal = false;
      this.courseIdToDelete = null;
    },
    selectCourse(course) {
      this.$emit('selectCourse', course);
    },
    async openRegistration(course) {
      this.isLoading = true;
      try {
        const client = await this.getApiClient();
        const response = await client.put(`/api/courses/${course.id}/toggle-registration`, { isRegistrationOpen: 1 });
        alert(response.data.message);
        this.$emit('fetchCourses');
      } catch (error) {
        console.error('Error opening registration:', error);
        const errorMessage = error.response?.data?.error || 'Failed to open registration. Please try again.';
        alert(errorMessage);
      } finally {
        this.isLoading = false;
      }
    },
    async closeRegistration(course) {
      this.isLoading = true;
      try {
        const client = await this.getApiClient();
        const response = await client.put(`/api/courses/${course.id}/toggle-registration`, { isRegistrationOpen: 0 });
        alert(response.data.message);
        this.$emit('fetchCourses');
      } catch (error) {
        console.error('Error closing registration:', error);
        const errorMessage = error.response?.data?.error || 'Failed to close registration. Please try again.';
        alert(errorMessage);
      } finally {
        this.isLoading = false;
      }
    },
    async getApiClient() {
      const baseURL = await apiConfig.getBaseURL();
      return axios.create({
        baseURL,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    },
  },
  created() {
    this.$emit('fetchCourses');
  },
};
</script>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

input,
select {
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
input:focus,
select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 1px #3b82f6;
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

/* Simplified date/time input styling */
input[type="date"],
input[type="time"] {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  padding-right: 0.5rem;
}
</style>
<!-- client/src/components/staff/Students.vue -->
<template>
    <div class="space-y-8 p-6 bg-white text-gray-800">
      <!-- Loading Overlay -->
      <div v-if="isLoading" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
        <div class="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid"></div>
      </div>
  
      <h2 class="text-3xl font-extrabold transition-all duration-300 hover:text-blue-600">Student Management</h2>
  
      <!-- New/Edit Student Form -->
      <div class="bg-gray-50 p-6 rounded-xl shadow-md border border-gray-200 transition-all duration-300 hover:shadow-lg">
        <h3 class="text-lg font-semibold text-blue-500 mb-4 transition-colors duration-300 hover:text-blue-700">
          {{ editingStudent ? 'Edit Student' : 'New Student' }}
        </h3>
        <form @submit.prevent="saveStudent" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input v-model="student.name" placeholder="Student Name" required 
                   class="bg-white border border-gray-300 p-3 rounded-lg w-full text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300" />
            <input v-model="student.registerNo" placeholder="Register No" required 
                   class="bg-white border border-gray-300 p-3 rounded-lg w-full text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300" />
            <input v-model="student.dob" placeholder="DOB (DDMMYYYY)" required 
                   class="bg-white border border-gray-300 p-3 rounded-lg w-full text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300" />
          </div>
          <div class="flex space-x-4">
            <button type="submit" 
                    class="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 shadow-md">
              {{ editingStudent ? 'Update' : 'Create' }}
            </button>
            <button v-if="editingStudent" type="button" @click="cancelStudentEdit" 
                    class="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-all duration-300 transform hover:scale-105 shadow-md">
              Cancel
            </button>
          </div>
        </form>
      </div>
  
      <!-- Student List -->
      <div class="bg-gray-50 p-6 rounded-xl shadow-md border border-gray-200 transition-all duration-300 hover:shadow-lg">
        <h3 class="text-lg font-semibold text-blue-500 mb-4 transition-colors duration-300 hover:text-blue-700">Student List</h3>
        <div class="overflow-x-auto">
          <table class="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead>
              <tr class="bg-gray-100">
                <th class="py-3 px-4 text-left text-gray-600 font-semibold border-b border-gray-200">Name</th>
                <th class="py-3 px-4 text-left text-gray-600 font-semibold border-b border-gray-200">Register No</th>
                <th class="py-3 px-4 text-left text-gray-600 font-semibold border-b border-gray-200">DOB</th>
                <th class="py-3 px-4 text-left text-gray-600 font-semibold border-b border-gray-200">Actions</th>
              </tr>
            </thead>
            <transition-group name="list" tag="tbody">
              <tr v-for="s in students" :key="s.id" class="hover:bg-gray-100 transition-all duration-300">
                <td class="py-3 px-4 border-b border-gray-200 text-gray-800">{{ s.name }}</td>
                <td class="py-3 px-4 border-b border-gray-200 text-gray-800">{{ s.registerNo }}</td>
                <td class="py-3 px-4 border-b border-gray-200 text-gray-800">{{ s.dob }}</td>
                <td class="py-3 px-4 border-b border-gray-200 flex space-x-3">
                  <button @click="showEditPopup(s)" class="text-blue-500 hover:text-blue-700 transition-colors duration-300 transform hover:scale-110">
                    <PencilIcon class="w-5 h-5" />
                  </button>
                  <button @click="showDeletePopup(s.id)" class="text-red-500 hover:text-red-700 transition-colors duration-300 transform hover:scale-110">
                    <TrashIcon class="w-5 h-5" />
                  </button>
                  <button @click="$emit('selectStudentForCourses', s)" class="text-green-500 hover:text-green-700 transition-colors duration-300 transform hover:scale-110">
                    <PlusIcon class="w-5 h-5" />
                  </button>
                </td>
              </tr>
            </transition-group>
          </table>
        </div>
      </div>
  
      <!-- Assign Courses to Selected Student -->
      <div v-if="selectedStudent" class="bg-gray-50 p-6 rounded-xl shadow-md border border-gray-200 transition-all duration-300 hover:shadow-lg">
        <h3 class="text-lg font-semibold text-blue-500 mb-4 transition-colors duration-300 hover:text-blue-700">Assign Courses to {{ selectedStudent.name }}</h3>
        <div class="space-y-3">
          <div v-for="c in courses" :key="c.id" class="flex items-center p-2 bg-white rounded-lg hover:bg-gray-100 transition-all duration-300">
            <input type="checkbox" 
                   :checked="assignedCourses.some(ac => ac.id === c.id)" 
                   @change="$emit('toggleCourseAssignment', c.id)" 
                   class="mr-2 h-4 w-4 text-blue-500 focus:ring-blue-500 bg-white border-gray-300" />
            <span class="text-gray-800 flex-1">{{ c.name }} (Exam: {{ c.examDate }} {{ c.examTime }} IST)</span>
          </div>
        </div>
      </div>
  
      <!-- Edit Student Popup (Modal) -->
      <div v-if="showEditStudentModal" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white p-6 rounded-lg shadow-lg border border-gray-200 w-full max-w-md transition-all duration-300">
          <h3 class="text-lg font-semibold text-blue-500 mb-4">Edit Student</h3>
          <form @submit.prevent="confirmEditStudent" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input v-model="editStudentData.name" placeholder="Student Name" required 
                     class="bg-white border border-gray-300 p-3 rounded-lg w-full text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300" />
              <input v-model="editStudentData.registerNo" placeholder="Register No" required 
                     class="bg-white border border-gray-300 p-3 rounded-lg w-full text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300" />
              <input v-model="editStudentData.dob" placeholder="DOB (DDMMYYYY)" required 
                     class="bg-white border border-gray-300 p-3 rounded-lg w-full text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300" />
            </div>
            <div class="flex space-x-4 mt-4">
              <button type="submit" class="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 shadow-md">
                Save Changes
              </button>
              <button type="button" @click="closeEditStudentModal" class="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-all duration-300 transform hover:scale-105 shadow-md">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
  
      <!-- Delete Student Popup (Modal) -->
      <div v-if="showDeleteStudentModal" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white p-6 rounded-lg shadow-lg border border-gray-200 w-full max-w-md transition-all duration-300">
          <h3 class="text-lg font-semibold text-red-500 mb-4">Confirm Deletion</h3>
          <p class="text-gray-800 mb-4">Are you sure you want to delete this student? This action cannot be undone.</p>
          <div class="flex space-x-4">
            <button @click="confirmDeleteStudent" class="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-all duration-300 transform hover:scale-105 shadow-md">
              Delete
            </button>
            <button @click="closeDeleteStudentModal" class="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-all duration-300 transform hover:scale-105 shadow-md">
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
  import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/vue/24/solid';
  
  export default defineComponent({
    name: 'StaffStudents',
    components: { PencilIcon, TrashIcon, PlusIcon },
    props: {
      user: {
        type: Object,
        required: true,
        default: () => ({}),
      },
      students: {
        type: Array,
        default: () => [],
      },
      selectedStudent: {
        type: Object,
        default: null,
      },
      courses: {
        type: Array,
        default: () => [],
      },
      assignedCourses: {
        type: Array,
        default: () => [],
      },
    },
    data() {
      return {
        student: { name: '', registerNo: '', dob: '' },
        editingStudent: null,
        isLoading: false,
        showEditStudentModal: false,
        showDeleteStudentModal: false,
        editStudentData: {},
        studentIdToDelete: null,
      };
    },
    methods: {
      async saveStudent() {
        this.isLoading = true;
        try {
          const studentData = { ...this.student, userType: 'staff', userId: this.user.id };
          if (this.editingStudent) {
            await axios.put(`http://localhost:3000/api/students/${this.editingStudent.id}`, studentData);
          } else {
            await axios.post('http://localhost:3000/api/students', studentData);
          }
          this.$emit('fetchStudents');
          this.resetStudentForm();
        } catch (error) {
          console.error('Error saving student:', error);
          alert('Failed to save student. Please try again.');
        } finally {
          this.isLoading = false;
        }
      },
      showEditPopup(student) {
        this.editStudentData = { ...student };
        this.showEditStudentModal = true;
      },
      async confirmEditStudent() {
        this.isLoading = true;
        try {
          await axios.put(`http://localhost:3000/api/students/${this.editStudentData.id}`, this.editStudentData);
          this.$emit('fetchStudents');
          this.closeEditStudentModal();
        } catch (error) {
          console.error('Error updating student:', error);
          alert('Failed to update student. Please try again.');
        } finally {
          this.isLoading = false;
        }
      },
      closeEditStudentModal() {
        this.showEditStudentModal = false;
        this.editStudentData = {};
      },
      showDeletePopup(id) {
        this.studentIdToDelete = id;
        this.showDeleteStudentModal = true;
      },
      async confirmDeleteStudent() {
        this.isLoading = true;
        try {
          await axios.delete(`http://localhost:3000/api/students/${this.studentIdToDelete}`, {
            data: { userType: 'staff', userId: this.user.id }
          });
          this.$emit('fetchStudents');
          this.closeDeleteStudentModal();
        } catch (error) {
          console.error('Error deleting student:', error);
          alert('Failed to delete student. Please try again.');
        } finally {
          this.isLoading = false;
        }
      },
      closeDeleteStudentModal() {
        this.showDeleteStudentModal = false;
        this.studentIdToDelete = null;
      },
      resetStudentForm() {
        this.student = { name: '', registerNo: '', dob: '' };
        this.editingStudent = null;
      },
      cancelStudentEdit() {
        this.resetStudentForm();
      },
      async fetchStudents() {
        this.isLoading = true;
        try {
          const { data } = await axios.get('http://localhost:3000/api/students');
          this.$emit('fetchStudents', data);
        } catch (error) {
          console.error('Error fetching students:', error);
          alert('Failed to fetch students. Please try again.');
        } finally {
          this.isLoading = false;
        }
      },
    },
    created() {
      this.$emit('fetchStudents');
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
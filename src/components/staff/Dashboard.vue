<!-- client/src/components/staff/Dashboard.vue -->
<template>
  <div class="flex h-screen bg-white text-gray-800 font-sans antialiased border-r border-gray-200">
    <!-- Sidebar -->
    <Sidebar :activeSection="activeSection" @updateSection="activeSection = $event" @logout="$emit('logout')" />

    <!-- Main Content -->
    <div class="flex-1 p-6 md:p-10 overflow-y-auto">
      <!-- Loading Overlay -->
      <div v-if="isLoading" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
        <div class="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid"></div>
      </div>

      <!-- Courses Section -->
      <Courses v-if="activeSection === 'courses'" 
               :courses="courses" 
               :selectedCourse="selectedCourse" 
               :questions="questions" 
               :user="user"
               @fetchCourses="fetchCourses" 
               @selectCourse="selectCourse" 
               @createQuestion="createQuestion" 
               @editQuestion="editQuestion" 
               @deleteQuestion="deleteQuestion" 
               @updateQuestion="updateQuestion" />

      <!-- Students Section -->
      <Students v-if="activeSection === 'students'" 
                :students="students" 
                :selectedStudent="selectedStudent" 
                :courses="courses" 
                :assignedCourses="assignedCourses" 
                :user="user"
                @fetchStudents="fetchStudents" 
                @saveStudent="saveStudent" 
                @editStudent="editStudent" 
                @deleteStudent="deleteStudent" 
                @selectStudentForCourses="selectStudentForCourses" 
                @fetchAssignedCourses="fetchAssignedCourses" 
                @toggleCourseAssignment="toggleCourseAssignment" />
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { defineComponent } from 'vue';
import Sidebar from './Sidebar.vue';
import Courses from './Courses.vue';
import Students from './Students.vue';

export default defineComponent({
  name: 'StaffDashboard',
  components: { Sidebar, Courses, Students },
  props: {
    user: {
      type: Object,
      required: true,
      default: () => ({}),
    },
  },
  data() {
    return {
      activeSection: 'courses',
      courses: [],
      selectedCourse: null,
      questions: [],
      students: [],
      selectedStudent: null,
      assignedCourses: [],
      isLoading: false,
    };
  },
  methods: {
    // Course Methods
    async fetchCourses() {
      this.isLoading = true;
      try {
        const { data } = await axios.get('/api/courses'); // Relative path
        this.courses = data;
      } catch (error) {
        console.error('Error fetching courses:', error);
        alert('Failed to fetch courses. Please try again.');
      } finally {
        this.isLoading = false;
      }
    },
    async selectCourse(course) {
      this.selectedCourse = { ...course };
      await this.fetchQuestions(course.id);
    },
    async fetchQuestions(courseId) {
      this.isLoading = true;
      try {
        const { data } = await axios.get(`/api/questions/${courseId}`);
        this.questions = data;
      } catch (error) {
        console.error('Error fetching questions:', error);
        alert('Failed to fetch questions. Please try again.');
      } finally {
        this.isLoading = false;
      }
    },
    async createQuestion(questionData) {
      this.isLoading = true;
      try {
        const data = { ...questionData, courseId: this.selectedCourse.id, userType: 'staff', userId: this.user.id };
        await axios.post('/api/questions', data);
        await this.fetchQuestions(this.selectedCourse.id);
      } catch (error) {
        console.error('Error creating question:', error);
        alert('Failed to create question. Please try again.');
      } finally {
        this.isLoading = false;
      }
    },
    editQuestion(question) {
      this.$refs.courses.showEditQuestionPopup(question);
    },
    async deleteQuestion(id) {
      this.isLoading = true;
      try {
        await axios.delete(`/api/questions/${id}`, {
          data: { userType: 'staff', userId: this.user.id, courseId: this.selectedCourse.id }
        });
        await this.fetchQuestions(this.selectedCourse.id);
      } catch (error) {
        console.error('Error deleting question:', error);
        alert('Failed to delete question. Please try again.');
      } finally {
        this.isLoading = false;
      }
    },
    async updateQuestion(updatedQuestion) {
      this.isLoading = true;
      try {
        await axios.put(`/api/questions/${updatedQuestion.id}`, updatedQuestion);
        await this.fetchQuestions(this.selectedCourse.id);
      } catch (error) {
        console.error('Error updating question:', error);
        alert('Failed to update question. Please try again.');
      } finally {
        this.isLoading = false;
      }
    },

    // Student Methods
    async saveStudent(studentData) {
      this.isLoading = true;
      try {
        const data = { ...studentData, userType: 'staff', userId: this.user.id };
        if (this.editingStudent) {
          await axios.put(`/api/students/${this.editingStudent.id}`, data);
        } else {
          await axios.post('/api/students', data);
        }
        await this.fetchStudents();
      } catch (error) {
        console.error('Error saving student:', error);
        alert('Failed to save student. Please try again.');
      } finally {
        this.isLoading = false;
      }
    },
    async fetchStudents() {
      this.isLoading = true;
      try {
        const { data } = await axios.get('/api/students');
        this.students = data;
      } catch (error) {
        console.error('Error fetching students:', error);
        alert('Failed to fetch students. Please try again.');
      } finally {
        this.isLoading = false;
      }
    },
    editStudent(student) {
      this.$refs.students.showEditPopup(student);
    },
    async deleteStudent(id) {
      this.isLoading = true;
      try {
        await axios.delete(`/api/students/${id}`, {
          data: { userType: 'staff', userId: this.user.id }
        });
        await this.fetchStudents();
      } catch (error) {
        console.error('Error deleting student:', error);
        alert('Failed to delete student. Please try again.');
      } finally {
        this.isLoading = false;
      }
    },

    // Course Assignment Methods
    async selectStudentForCourses(student) {
      this.selectedStudent = student;
      await this.fetchAssignedCourses(student.id);
    },
    async fetchAssignedCourses(studentId) {
      this.isLoading = true;
      try {
        const { data } = await axios.get(`/api/student-courses/${studentId}`);
        this.assignedCourses = data;
      } catch (error) {
        console.error('Error fetching assigned courses:', error);
        alert('Failed to fetch assigned courses. Please try again.');
      } finally {
        this.isLoading = false;
      }
    },
    async toggleCourseAssignment(courseId) {
      this.isLoading = true;
      try {
        const isAssigned = this.assignedCourses.some(c => c.id === courseId);
        if (isAssigned) {
          await axios.delete('/api/student-courses', {
            data: { studentId: this.selectedStudent.id, courseId }
          });
        } else {
          await axios.post('/api/student-courses', {
            studentId: this.selectedStudent.id,
            courseId
          });
        }
        await this.fetchAssignedCourses(this.selectedStudent.id);
      } catch (error) {
        console.error('Error toggling course assignment:', error);
        alert('Failed to toggle course assignment. Please try again.');
      } finally {
        this.isLoading = false;
      }
    },
  },
  created() {
    this.fetchCourses();
    this.fetchStudents();
  },
});
</script>

<style scoped>
/* No additional styles needed; Tailwind handles transitions and animations */
</style>
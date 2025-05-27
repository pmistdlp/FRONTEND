<template>
  <div class="flex h-screen bg-white text-gray-800 font-sans antialiased border-r border-gray-200">
    <Sidebar :activeSection="activeSection" :selectedCourse="selectedCourse" @updateSection="updateSection" @logout="showLogoutModal" />
    <div class="flex-1 p-6 md:p-10 overflow-y-auto">
      <Faculty ref="faculty" v-if="activeSection === 'Faculty'" 
               :facultyList="facultyList" 
               @fetchFaculty="fetchFaculty" />
      <Courses ref="courses" v-if="activeSection === 'courses'" 
               :courses="courses" 
               :selectedCourse="selectedCourse" 
               :user="user" 
               @fetchCourses="fetchCourses" 
               @selectCourse="selectCourse" />
      <Questions v-if="activeSection === 'questions'" 
                 :selectedCourse="selectedCourse" 
                 :questions="questions" 
                 :user="user" 
                 @fetchQuestions="handleFetchQuestions" 
                 @fetchCourseHistory="fetchCourseHistory" />
      <Students v-if="activeSection === 'students'" 
                :students="students" 
                :selectedStudent="selectedStudent" 
                :courses="courses" 
                :assignedCourses="assignedCourses" 
                :user="user" 
                @fetchStudents="fetchStudents" 
                @editStudent="editStudent" 
                @deleteStudent="deleteStudent" 
                @selectStudentForCourses="selectStudentForCourses" 
                @fetchAssignedCourses="fetchAssignedCourses" 
                @toggleCourseAssignment="toggleCourseAssignment" 
                @fetchStudentHistory="fetchStudentHistory" />
      <History v-if="activeSection === 'history'" 
               :courseHistory="courseHistory" 
               :studentHistory="studentHistory" 
               :user="user" />
      <Result v-if="activeSection === 'results'" 
              :user="user" />
      <AdminEnrollments v-if="activeSection === 'admin-enrollments'" 
                       :user="user" />
    </div>

    <!-- Logout Confirmation Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center space-y-4 max-w-sm w-full">
        <ExclamationTriangleIcon class="w-12 h-12 text-yellow-500" />
        <p class="text-gray-800 font-semibold text-center text-base">
          Are you sure you want to logout?
        </p>
        <div class="flex space-x-4 w-full">
          <button 
            @click="confirmLogout" 
            class="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all duration-200 font-medium"
          >
            Yes
          </button>
          <button 
            @click="showModal = false" 
            class="flex-1 bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition-all duration-200 font-medium"
          >
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
import { ExclamationTriangleIcon } from '@heroicons/vue/24/solid';
import Sidebar from './Sidebar.vue';
import Faculty from './Faculty.vue';
import Courses from './Courses.vue';
import Questions from './Questions.vue';
import Students from './Students.vue';
import History from './History.vue';
import Result from './Result.vue';
import AdminEnrollments from './AdminEnrollments.vue';

export default defineComponent({
  name: 'Dashboard',
  components: {
    Sidebar,
    Faculty,
    Courses,
    Questions,
    Students,
    History,
    Result,
    AdminEnrollments,
    ExclamationTriangleIcon,
  },
  props: {
    user: { type: Object, required: true, default: () => ({}) },
  },
  data() {
    return {
      activeSection: 'courses',
      facultyList: [],
      courses: [],
      selectedCourse: null,
      questions: [],
      students: [],
      selectedStudent: null,
      assignedCourses: [],
      courseHistory: [],
      studentHistory: [],
      isLoading: false,
      showModal: false,
    };
  },
  methods: {
    async fetchFaculty() {
      this.isLoading = true;
      try {
        console.log('Fetching faculty...');
        const { data } = await axios.get('/api/staff');
        console.log('Faculty data received:', data);
        this.facultyList = data;
      } catch (error) {
        console.error('Error fetching faculty:', error);
        alert('Failed to fetch faculty. Please try again.');
      } finally {
        this.isLoading = false;
      }
    },
    async fetchCourses() {
      this.isLoading = true;
      try {
        const { data } = await axios.get('/api/courses');
        this.courses = data;
      } catch (error) {
        console.error('Error fetching courses:', error);
        alert('Failed to fetch courses. Please try again.');
      } finally {
        this.isLoading = false;
      }
    },
    selectCourse(course) {
      this.selectedCourse = { ...course };
      this.activeSection = 'questions';
      this.fetchQuestions(course.id);
    },
    async fetchQuestions(courseId, data = null) {
      this.isLoading = true;
      try {
        if (data) {
          this.questions = data;
        } else {
          const { data: responseData } = await axios.get(`/api/questions/${courseId}`);
          this.questions = responseData;
        }
      } catch (error) {
        console.error('Error fetching questions:', error);
        alert('Failed to fetch questions. Please try again.');
      } finally {
        this.isLoading = false;
      }
    },
    async fetchCourseHistory() {
      this.isLoading = true;
      try {
        const response = await axios.get('/api/history/course');
        console.log('Course history response:', response.status, response.data);
        this.courseHistory = response.data || [];
      } catch (error) {
        if (error.response) {
          console.error('Error fetching course history:', error.response.status, error.response.data);
          alert(`Failed to fetch course history: ${error.response.data.error || 'Unknown error'}. Please try again.`);
        } else if (error.request) {
          console.error('Network error fetching course history:', error.message);
          alert('Failed to fetch course history: Network error. Please check your connection and try again.');
        } else {
          console.error('Unexpected error fetching course history:', error.message);
          alert('Failed to fetch course history: Unexpected error. Please try again.');
        }
      } finally {
        this.isLoading = false;
      }
    },
    async fetchStudents() {
      this.isLoading = true;
      try {
        const { data } = await axios.get('/api/student');
        this.students = data;
      } catch (error) {
        console.error('Error fetching students:', error);
        alert('Failed to fetch students. Please try again.');
      } finally {
        this.isLoading = false;
      }
    },
    editStudent(student) {
      this.$refs.students.editStudent(student);
    },
    async deleteStudent(id) {
      this.isLoading = true;
      try {
        await axios.delete(`/api/student/${id}`, {
          data: { userType: 'admin', userId: this.user.id }
        });
        this.fetchStudents();
        this.fetchStudentHistory();
      } catch (error) {
        console.error('Error deleting student:', error);
        alert('Failed to delete student. Please try again.');
      } finally {
        this.isLoading = false;
      }
    },
    selectStudentForCourses(student) {
      this.selectedStudent = student ? { ...student } : null;
      if (this.selectedStudent) {
        this.fetchAssignedCourses(this.selectedStudent.id);
      } else {
        this.assignedCourses = [];
      }
    },
    async fetchAssignedCourses(studentId) {
      this.isLoading = true;
      try {
        if (!studentId) {
          this.assignedCourses = [];
          return;
        }
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
        if (!this.selectedStudent) {
          throw new Error('No student selected');
        }
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
        this.fetchAssignedCourses(this.selectedStudent.id);
      } catch (error) {
        console.error('Error toggling course assignment:', error);
        alert('Failed to toggle course assignment. Please try again.');
      } finally {
        this.isLoading = false;
      }
    },
    async fetchStudentHistory() {
      this.isLoading = true;
      try {
        const response = await axios.get('/api/history/student');
        console.log('Student history response:', response.status, response.data);
        this.studentHistory = response.data || [];
      } catch (error) {
        if (error.response) {
          console.error('Error fetching student history:', error.response.status, error.response.data);
          alert(`Failed to fetch student history: ${error.response.data.error || 'Unknown error'}. Please try again.`);
        } else if (error.request) {
          console.error('Network error fetching student history:', error.message);
          alert('Failed to fetch student history: Network error. Please check your connection and try again.');
        } else {
          console.error('Unexpected error fetching student history:', error.message);
          alert('Failed to fetch student history: Unexpected error. Please try again.');
        }
      } finally {
        this.isLoading = false;
      }
    },
    updateSection(section) {
      this.activeSection = section;
      if (section === 'Faculty') {
        this.fetchFaculty();
      }
      if (section === 'history') {
        this.fetchCourseHistory();
        this.fetchStudentHistory();
      }
      if (section !== 'questions') {
        this.selectedCourse = null;
        this.questions = [];
      }
    },
    handleFetchQuestions(courseId, data) {
      this.fetchQuestions(courseId, data);
    },
    showLogoutModal() {
      this.showModal = true;
    },
    confirmLogout() {
      this.showModal = false;
      this.$emit('logout');
    },
  },
  created() {
    this.fetchFaculty();
    this.fetchCourses();
    this.fetchStudents();
    this.fetchCourseHistory();
    this.fetchStudentHistory();
  },
});
</script>

<style scoped>
/* Add any scoped styles if needed */
</style>
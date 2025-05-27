<template>
  <div class="space-y-6 p-4 bg-white text-gray-800 relative">
    <!-- Course Selection -->
    <div>
      <h2 class="text-2xl font-bold transition-all duration-300 hover:text-blue-600">Exam Results</h2>

      <!-- No Courses -->
      <div v-if="!courses.length" class="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200 text-center">
        <p class="text-gray-600 text-sm">No published courses available.</p>
      </div>

      <!-- Course List -->
      <div v-else class="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
        <h3 class="text-base font-semibold text-blue-500 mb-4 flex items-center">
          <AcademicCapIcon class="w-6 h-6 mr-2" /> Available Courses
        </h3>
        <div class="max-h-[400px] overflow-y-auto scrollbar-hidden">
          <table class="min-w-full bg-white border border-gray-200 rounded-md text-sm">
            <thead class="sticky top-0 bg-gray-100">
              <tr>
                <th class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">Name</th>
                <th class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">Course Code</th>
                <th class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">Platform</th>
                <th class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="course in courses" :key="course.id" class="hover:bg-gray-50 transition-all duration-200">
                <td class="py-2 px-3 border-b border-gray-200">{{ course.name }}</td>
                <td class="py-2 px-3 border-b border-gray-200">{{ course.course_code || 'N/A' }}</td>
                <td class="py-2 px-3 border-b border-gray-200">{{ course.learning_platform }}</td>
                <td class="py-2 px-3 border-b border-gray-200">
                  <button
                    @click="fetchResults(course.id)"
                    class="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 transition-all duration-200 flex items-center space-x-1 text-sm"
                  >
                    <EyeIcon class="w-4 h-4" />
                    <span>View Results</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Results View -->
    <div v-if="resultsLoaded && selectedCourse">
      <!-- Loading State -->
      <div v-if="isResultsLoading" class="text-center">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid"></div>
        <p class="text-gray-600 mt-2 text-sm">Loading results...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="resultsError" class="bg-red-50 p-4 rounded-lg shadow-sm border border-gray-200 text-center">
        <p class="text-red-600 text-sm">{{ resultsError }}</p>
      </div>

      <!-- No Results -->
      <div v-else-if="!results.length" class="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200 text-center">
        <p class="text-gray-600 text-sm">No students have taken this exam yet.</p>
      </div>

      <!-- Results Table -->
      <div v-else class="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-base font-semibold text-blue-500 flex items-center">
            <AcademicCapIcon class="w-6 h-6 mr-2" /> Results for {{ selectedCourse.name }}
          </h3>
          <button
            @click="downloadReport(selectedCourse.id)"
            class="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600 transition-all duration-200 flex items-center space-x-1 text-sm"
            :disabled="isDownloading"
          >
            <DownloadIcon class="w-4 h-4" />
            <span>{{ isDownloading ? 'Downloading...' : 'Download Report' }}</span>
          </button>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full bg-white border border-gray-200 rounded-md text-sm">
            <thead class="sticky top-0 bg-gray-100">
              <tr>
                <th class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">Name</th>
                <th class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">Register No.</th>
                <th v-for="co in 6" :key="`co${co}`" class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">
                  CO{{ co }} Marks
                </th>
                <th v-for="co in 6" :key="`co${co}%`" class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">
                  CO{{ co }} %
                </th>
                <th class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">Overall Marks</th>
                <th class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">Overall %</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="result in results" :key="result.studentId" class="hover:bg-gray-50 transition-all duration-200">
                <td class="py-2 px-3 border-b border-gray-200">{{ result.studentName }}</td>
                <td class="py-2 px-3 border-b border-gray-200">{{ result.registerNumber }}</td>
                <td v-for="co in 6" :key="`co${co}`" class="py-2 px-3 border-b border-gray-200">
                  {{ result[`co${co}Marks`] }}
                </td>
                <td v-for="co in 6" :key="`co${co}%`" class="py-2 px-3 border-b border-gray-200">
                  {{ result[`co${co}Percentage`] }}{{ result[`co${co}Percentage`] !== 'A' && result[`co${co}Percentage`] !== 'M' && result[`co${co}Percentage`] !== '-' ? '%' : '' }}
                </td>
                <td class="py-2 px-3 border-b border-gray-200">{{ result.overallMarks }}</td>
                <td class="py-2 px-3 border-b border-gray-200">
                  {{ result.overallPercentage }}{{ result.overallPercentage !== 'A' && result.overallPercentage !== 'M' ? '%' : '' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import apiConfig from '@/config/apiConfig';
import { AcademicCapIcon, EyeIcon, ArrowDownTrayIcon as DownloadIcon } from '@heroicons/vue/24/solid';

export default {
  components: { AcademicCapIcon, EyeIcon, DownloadIcon },
  props: {
    user: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      courses: [],
      selectedCourse: null,
      results: [],
      isResultsLoading: false,
      resultsLoaded: false,
      resultsError: '',
      isDownloading: false,
    };
  },
  computed: {
    studentId() {
      return this.user?.id || null; // Allow null for admin context
    },
    isAdmin() {
      return this.user?.role === 'admin';
    },
  },
  async mounted() {
    await this.fetchCourses();
  },
  methods: {
    async fetchCourses() {
      try {
        const baseURL = await apiConfig.getBaseURL();
        let endpoint;
        if (this.isAdmin) {
          // Admin fetches all published courses
          endpoint = `${baseURL}/api/admin-enrollments/courses`;
        } else if (this.studentId) {
          // Student fetches their assigned courses
          endpoint = `${baseURL}/api/results/courses/${this.studentId}`;
        } else {
          throw new Error('User role or student ID not provided');
        }

        const response = await axios.get(endpoint);
        this.courses = response.data.map(course => ({
          ...course,
          coCount: course.coCount || 2, // Default to 2 COs if not specified
        }));
      } catch (error) {
        console.error('Error fetching courses:', error);
        this.$emit('show-message', `Failed to fetch courses: ${error.response?.data?.error || error.message}`);
      }
    },
    async fetchResults(courseId) {
      this.isResultsLoading = true;
      this.resultsLoaded = false;
      this.resultsError = '';
      this.results = [];
      this.selectedCourse = this.courses.find(course => course.id === courseId);

      try {
        const baseURL = await apiConfig.getBaseURL();
        const response = await axios.get(`${baseURL}/api/results/${courseId}`);
        this.results = response.data;
        this.resultsLoaded = true;
      } catch (error) {
        console.error('Error fetching results:', error);
        this.resultsError = `Failed to fetch results: ${error.response?.data?.error || error.message}`;
      } finally {
        this.isResultsLoading = false;
      }
    },
    async downloadReport(courseId) {
      this.isDownloading = true;
      try {
        const baseURL = await apiConfig.getBaseURL();
        const response = await axios.get(`${baseURL}/api/results/${courseId}/download`, {
          responseType: 'blob', // Important for file download
        });

        // Create a URL for the blob and trigger download
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', response.headers['content-disposition']?.match(/filename="(.+)"/)?.[1] || `results_${courseId}.xlsx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        this.$emit('show-message', 'Report downloaded successfully');
      } catch (error) {
        console.error('Error downloading report:', error);
        this.$emit('show-message', `Failed to download report: ${error.response?.data?.error || error.message}`);
      } finally {
        this.isDownloading = false;
      }
    },
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
.space-y-2 { --space-y: 0.5rem; }
.space-x-2 { --space-x: 0.5rem; }

.space-y-6 > * + *,
.space-y-4 > * + *,
.space-y-2 > * + * {
  margin-top: var(--space-y);
}

.space-x-2 > * + * {
  margin-left: var(--space-x);
}

.transition-all {
  transition: all 0.2s ease;
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
  .px-3 {
    padding-left: 0.5rem;
    padding-right: 0.5rem;
  }
  .py-1 {
    padding-top: 0.25rem;
    padding-bottom: 0.25rem;
  }
  table {
    font-size: 0.75rem;
  }
  th, td {
    padding: 0.5rem;
  }
}
</style>
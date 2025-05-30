<template>
  <div class="space-y-6 p-4 bg-white text-gray-800">
    <!-- Generic Loading Spinner -->
    <div v-if="isLoading" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
      <div class="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid"></div>
      <p class="text-white ml-4">Processing...</p>
    </div>
    <!-- Saving Animation -->
    <div v-if="isSaving" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
      <div class="flex items-center space-x-3 bg-white p-4 rounded-lg shadow-lg">
        <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
        <p class="text-gray-800 font-semibold">Saving Status Updates...</p>
      </div>
    </div>

    <h2 class="text-2xl font-bold transition-all duration-300 hover:text-blue-600">Admin Enrollments Dashboard</h2>

    <div class="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
      <h3 class="text-base font-semibold text-blue-500 mb-4">Select Course</h3>
      <select v-model="selectedCourseId" @change="fetchStudentsForCourse" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 text-sm">
        <option value="" disabled>Select a course</option>
        <option v-for="course in courses" :key="course.id" :value="course.id">
          {{ course.name }} ({{ course.course_code || '-' }}) - {{ course.examDate }} {{ course.examTime }} IST
        </option>
      </select>
    </div>

    <div v-if="selectedCourseId" class="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
      <h3 class="text-base font-semibold text-blue-500 mb-4">Enrolled Students for Selected Course</h3>
      <!-- Search Box -->
      <div class="mb-4 flex items-center space-x-2">
        <div class="relative flex-1">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Search by name or register number..." 
            class="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 text-sm transition-all duration-200"
            aria-label="Search students"
          />
          <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <button 
            v-if="searchQuery" 
            @click="searchQuery = ''" 
            class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full bg-white border border-gray-200 rounded-md text-sm">
          <thead class="bg-gray-100">
            <tr>
              <th class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">
                <input 
                  type="checkbox" 
                  :checked="selectAllStudents" 
                  :indeterminate.prop="isIndeterminate" 
                  @change="toggleSelectAllStudents" 
                  class="h-4 w-4 rounded-full" 
                  aria-label="Select all students and mark as eligible and paid"
                />
              </th>
              <th class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">Name</th>
              <th class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">Register No</th>
              <th class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">DOB</th>
              <th class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">Aadhar</th>
              <th class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">ABC ID</th>
              <th class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">Eligible</th>
              <th class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">Payment Confirmed</th>
              <th class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">Actions</th>
            </tr>
          </thead>
          <tbody>
            <transition-group name="list">
              <tr v-for="student in filteredStudents" :key="student.id" class="hover:bg-gray-50 transition-all duration-200">
                <td class="py-2 px-3 border-b border-gray-200">
                  <input 
                    type="checkbox" 
                    v-model="selectedStudentIds" 
                    :value="student.id" 
                    class="h-4 w-4 rounded-full" 
                    aria-label="Select student"
                  />
                </td>
                <td class="py-2 px-3 border-b border-gray-200">{{ student.name || 'N/A' }}</td>
                <td class="py-2 px-3 border-b border-gray-200">{{ student.registerNo || 'N/A' }}</td>
                <td class="py-2 px-3 border-b border-gray-200">{{ student.dob || 'N/A' }}</td>
                <td class="py-2 px-3 border-b border-gray-200">{{ student.aadharNumber || 'N/A' }}</td>
                <td class="py-2 px-3 border-b border-gray-200">{{ student.abcId || 'N/A' }}</td>
                <td class="py-2 px-3 border-b border-gray-200">
                  <input 
                    type="checkbox" 
                    v-model="student.isEligible" 
                    class="h-4 w-4 rounded-full" 
                    aria-label="Toggle eligibility"
                  />
                </td>
                <td class="py-2 px-3 border-b border-gray-200">
                  <input 
                    type="checkbox" 
                    v-model="student.paymentConfirmed" 
                    class="h-4 w-4 rounded-full" 
                    aria-label="Toggle payment confirmation"
                  />
                </td>
                <td class="py-2 px-3 border-b border-gray-200">
                  <button 
                    @click="downloadHallTicketForStudent(student.id)" 
                    :disabled="!student.isEligible || !student.paymentConfirmed || isDownloading"
                    class="bg-indigo-500 text-white px-3 py-1 rounded-md hover:bg-indigo-600 disabled:bg-gray-400 transition-all duration-200 text-xs"
                    aria-label="Download hall ticket"
                  >
                    Hall Ticket
                  </button>
                </td>
              </tr>
            </transition-group>
          </tbody>
        </table>
      </div>
      <div class="mt-4 flex space-x-2">
        <button 
          @click="saveStatusUpdates" 
          :disabled="selectedStudentIds.length === 0 || isSaving"
          class="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 disabled:bg-gray-400 transition-all duration-200 text-sm"
          aria-label="Save status updates"
        >
          Save Status Updates ({{ selectedStudentIds.length }})
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import apiConfig from '@/config/apiConfig';
import { defineComponent, ref, computed } from 'vue';
import { jsPDF } from 'jspdf';
import uletkzLogo from '@/images/uletkz.png';
import pmistLogo from '@/images/pmist.png';
import nodalOfficerSignature from '@/images/nodalofficer-signature.png';

// Create Axios instance without baseURL initially
const api = axios.create({ withCredentials: true });

// Utility to fetch image as base64 in a browser environment
async function fetchImageAsBase64(url) {
  console.log(`Attempting to fetch image from: ${url}`);
  const startTime = Date.now();
  try {
    const response = await axios.get(url, { responseType: 'blob' });
    console.log(`Image fetch successful, status: ${response.status}, response size: ${response.data.size} bytes`);

    let mimeType = response.headers['content-type']?.toLowerCase();
    if (!mimeType || !mimeType.startsWith('image/')) {
      const extension = url.split('.').pop().toLowerCase();
      const mimeTypes = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
        gif: 'image/gif',
        bmp: 'image/bmp',
        tiff: 'image/tiff',
        ico: 'image/x-icon',
        svg: 'image/svg+xml',
      };
      mimeType = mimeTypes[extension] || 'image/jpeg';
      console.log(`[Frontend] MIME type not provided in headers, inferred as ${mimeType} from extension .${extension}`);
    }

    if (mimeType === 'image/jpeg') {
      console.log('[Frontend] Detected JPG/JPEG image format');
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
      console.warn(`[Frontend] Image type ${mimeType} may not be supported by jsPDF. Attempting to load, but you may need to upload a JPEG, PNG, or WebP image.`);
    }

    const base64Image = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert image to Base64'));
        }
      };
      reader.onerror = () => reject(new Error('Error reading image blob'));
      reader.readAsDataURL(response.data);
    });

    const endTime = Date.now();
    console.log(`[Frontend] Image fetch and Base64 conversion took ${endTime - startTime}ms`);
    return base64Image;
  } catch (error) {
    const endTime = Date.now();
    console.error(`[Frontend] Image fetch failed after ${endTime - startTime}ms`);
    console.error('Error fetching image:', error.message);
    if (error.response) {
      console.error(`HTTP Status: ${error.response.status}, Status Text: ${error.response.statusText}`);
      throw new Error(`Failed to fetch image (HTTP ${error.response.status}): ${error.response.statusText}. Please ensure your profile photo is uploaded correctly at ${url}.`);
    } else if (error.request) {
      console.error('No response received from server. Possible network or CORS issue.');
      throw new Error(`Failed to fetch image: No response from server. Please check your network connection or ensure the backend is accessible at ${url}.`);
    } else {
      console.error('Error setting up the request:', error.message);
      throw new Error(`Failed to fetch image: ${error.message}. Please ensure your profile photo is a valid image (e.g., JPG, JPEG, PNG, WebP) and uploaded correctly at ${url}.`);
    }
  }
}

export default defineComponent({
  name: 'AdminEnrollments',
  props: {
    user: { type: Object, required: true, default: () => ({}) },
  },
  data() {
    return {
      isLoading: false,
      isSaving: false,
      courses: [],
      selectedCourseId: '',
      enrolledStudents: [],
      selectedStudentIds: [],
      selectAllStudents: false,
      baseUrl: '',
      searchQuery: '',
    };
  },
  setup() {
    const isDownloading = ref(false);
    return { isDownloading };
  },
  computed: {
    filteredStudents() {
      if (!this.searchQuery.trim()) {
        return this.enrolledStudents;
      }
      const query = this.searchQuery.toLowerCase().trim();
      return this.enrolledStudents.filter(student => 
        (student.name?.toLowerCase() || '').includes(query) || 
        (student.registerNo?.toLowerCase() || '').includes(query)
      );
    },
    isIndeterminate() {
      if (this.filteredStudents.length === 0) return false;
      const allSelectedAndTicked = this.filteredStudents.every(student => 
        this.selectedStudentIds.includes(student.id) && 
        student.isEligible && 
        student.paymentConfirmed
      );
      const someSelectedOrTicked = this.filteredStudents.some(student => 
        this.selectedStudentIds.includes(student.id) || 
        student.isEligible || 
        student.paymentConfirmed
      );
      return !allSelectedAndTicked && someSelectedOrTicked;
    },
  },
  async created() {
    console.log('[Frontend] Component created, initializing base URL...');
    try {
      const baseURL = await apiConfig.getBaseURL();
      api.defaults.baseURL = baseURL;
      this.baseUrl = baseURL;
      console.log('[Frontend] Base URL set to:', baseURL);
    } catch (error) {
      console.error('[Frontend] Failed to fetch base URL:', error);
      api.defaults.baseURL = 'https://mooc-backend-1.onrender.com'; // Fallback
      this.baseUrl = api.defaults.baseURL;
      console.log('[Frontend] Using fallback base URL:', this.baseUrl);
    }
    this.fetchCourses();
  },
  methods: {
    async fetchCourses() {
      console.log('[Frontend] Fetching courses...');
      this.isLoading = true;
      try {
        const response = await api.get('/api/admin-enrollments/courses');
        console.log('[Frontend] Courses fetched:', response.data);
        this.courses = response.data;
      } catch (error) {
        const errorMsg = error.response?.data?.error || error.message;
        console.error('[Frontend] Error fetching courses:', errorMsg);
        alert(`Failed to fetch courses: ${errorMsg}`);
      } finally {
        this.isLoading = false;
        console.log('[Frontend] Fetch courses complete, loading state:', this.isLoading);
      }
    },
    async fetchStudentsForCourse() {
      if (!this.selectedCourseId) {
        console.log('[Frontend] No course selected, resetting students...');
        this.enrolledStudents = [];
        this.selectedStudentIds = [];
        this.selectAllStudents = false;
        this.searchQuery = '';
        return;
      }
      console.log('[Frontend] Fetching students for course ID:', this.selectedCourseId);
      this.isLoading = true;
      try {
        const response = await api.get(`/api/admin-enrollments/students/${this.selectedCourseId}`);
        console.log('[Frontend] Raw students fetched:', response.data);
        this.enrolledStudents = response.data.map(student => ({
          id: student.id,
          name: student.name || 'N/A',
          registerNo: student.registerno || 'N/A',
          dob: student.dob || 'N/A',
          aadharNumber: student.aadharnumber || 'N/A',
          abcId: student.abcid || 'N/A',
          isEligible: student.iseligible === true || student.iseligible === 1,
          paymentConfirmed: student.paymentconfirmed === true || student.paymentconfirmed === 1,
          originalIsEligible: student.iseligible === true || student.iseligible === 1,
          originalPaymentConfirmed: student.paymentconfirmed === true || student.paymentconfirmed === 1
        }));
        console.log('[Frontend] Processed students:', this.enrolledStudents);
        this.updateSelectedStudents();
      } catch (error) {
        const errorMsg = error.response?.data?.error || error.message;
        console.error('[Frontend] Error fetching students:', errorMsg);
        alert(`Failed to fetch students: ${errorMsg}`);
      } finally {
        this.isLoading = false;
        console.log('[Frontend] Fetch students complete, loading state:', this.isLoading);
      }
    },
    toggleSelectAllStudents() {
      console.log('[Frontend] Toggling select all students, current state:', this.selectAllStudents);
      if (this.selectAllStudents) {
        this.selectedStudentIds = this.filteredStudents.map(student => student.id);
        this.filteredStudents.forEach(student => {
          student.isEligible = true;
          student.paymentConfirmed = true;
        });
        console.log('[Frontend] Selected all students and marked as eligible and paid:', this.selectedStudentIds);
      } else {
        this.selectedStudentIds = [];
        console.log('[Frontend] Deselected all students');
      }
      this.updateSelectedStudents();
    },
    updateSelectedStudents() {
      console.log('[Frontend] Updating selected students based on eligibility and payment...');
      if (this.filteredStudents.length === 0) {
        this.selectAllStudents = false;
        return;
      }
      this.selectAllStudents = this.selectedStudentIds.length === this.filteredStudents.length && 
                              this.filteredStudents.every(student => 
                                this.selectedStudentIds.includes(student.id) && 
                                student.isEligible && 
                                student.paymentConfirmed
                              );
      console.log('[Frontend] Updated selected student IDs:', this.selectedStudentIds, 'Select all:', this.selectAllStudents);
    },
    async saveStatusUpdates() {
      if (this.selectedStudentIds.length === 0) {
        console.log('[Frontend] No students selected, skipping save...');
        return;
      }
      console.log('[Frontend] Saving status updates for students:', this.selectedStudentIds);
      this.isSaving = true;
      try {
        const updates = this.selectedStudentIds.map(studentId => {
          const student = this.enrolledStudents.find(s => s.id === studentId);
          return {
            studentId: student.id,
            isEligible: student.isEligible ? 1 : 0,
            paymentConfirmed: student.paymentConfirmed ? 1 : 0
          };
        });
        console.log('[Frontend] Sending updates to backend:', updates);
        const response = await api.post('/api/admin-enrollments/update-status', {
          courseId: this.selectedCourseId,
          updates,
          userType: 'admin',
          userId: this.user.id
        });
        console.log('[Frontend] Status updates response:', response.data);
        this.enrolledStudents = this.enrolledStudents.map(student => ({
          ...student,
          originalIsEligible: student.isEligible,
          originalPaymentConfirmed: student.paymentConfirmed
        }));
        this.updateSelectedStudents();
        alert('Status updates saved successfully');
      } catch (error) {
        const errorMsg = error.response?.data?.error || error.message;
        console.error('[Frontend] Error saving status updates:', errorMsg);
        alert(`Failed to save status updates: ${errorMsg}`);
        this.enrolledStudents = this.enrolledStudents.map(student => ({
          ...student,
          isEligible: student.originalIsEligible,
          paymentConfirmed: student.originalPaymentConfirmed
        }));
        this.updateSelectedStudents();
      } finally {
        this.isSaving = false;
        console.log('[Frontend] Save status updates complete, saving state:', this.isSaving);
      }
    },
    async downloadHallTicketForStudent(studentId) {
      console.log('[Frontend] Initiating hall ticket download for student ID:', studentId, 'Course ID:', this.selectedCourseId);
      console.log('[Frontend] Using base URL:', this.baseUrl);
      if (!this.selectedCourseId) {
        console.error('[Frontend] Invalid courseId provided');
        alert('Failed to generate hall ticket: Invalid course ID');
        return;
      }
      this.isDownloading = true;
      try {
        const payload = {
          courseId: this.selectedCourseId,
          studentIds: [studentId],
        };
        console.log('[Frontend] Sending hall ticket request to backend:', payload);
        const response = await api.post('/api/admin-enrollments/hall-ticket', payload, { withCredentials: true });
        console.log('[Frontend] Received hall ticket response:', response.data);
        const { hallTickets } = response.data;
        if (!hallTickets || hallTickets.length === 0) {
          throw new Error('No hall ticket data returned from backend');
        }
        console.log('[Frontend] Hall tickets student data:', hallTickets.map(ticket => ticket.student));
        console.log('[Frontend] Full hall tickets data:', JSON.stringify(hallTickets, null, 2));

        // Removed the photo requirement check
        // Previously: if (!ticket.student || !ticket.student.photo) { throw new Error(...); }

        await this.generateHallTicketPDF(hallTickets, studentId);
      } catch (error) {
        const errorMsg = error.response?.data?.error || error.message;
        console.error('[Frontend] Error generating hall ticket:', errorMsg);
        alert(`Failed to generate hall ticket: ${errorMsg}`);
      } finally {
        this.isDownloading = false;
        console.log('[Frontend] Hall ticket download process complete, downloading state:', this.isDownloading);
      }
    },
    async generateHallTicketPDF(hallTickets, studentId) {
      console.log('[Frontend] Starting PDF generation with jsPDF for hall tickets:', hallTickets);
      const doc = new jsPDF();
      let yOffset = 10;

      for (const [index, ticket] of hallTickets.entries()) {
        const { student, course } = ticket;
        console.log(`[Frontend] Generating PDF content for hall ticket ${index + 1}, student: ${student?.name || 'N/A'}`);

        if (!course) {
          console.error(`[Frontend] Course data missing for hall ticket ${index + 1}`);
          doc.setFontSize(12);
          doc.setTextColor(255, 0, 0);
          doc.text('Error: Course data is missing for this hall ticket.', 10, yOffset);
          yOffset += 10;
          doc.text('Please contact the PMIST SWAYAM Nodal Office.', 10, yOffset);
          doc.save(`hall_ticket_error_${studentId}_${this.selectedCourseId}.pdf`);
          throw new Error('Course data is missing in hall ticket');
        }

        if (index > 0) {
          doc.addPage();
          yOffset = 10;
        }

        const logoY = yOffset;
        doc.addImage(uletkzLogo, 'PNG', 10, logoY, 30, 12);
        doc.addImage(pmistLogo, 'PNG', 170, logoY, 30, 12);

        const textBlockStartX = 40;
        const textBlockWidth = 130;
        const textBlockCenterX = textBlockStartX + textBlockWidth / 2;

        yOffset += 4;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
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
        doc.text(student.name || 'N/A', 60, yOffset);
        yOffset += 8;
        doc.setFont('helvetica', 'bold');
        doc.text('Register Number:', 10, yOffset);
        doc.setFont('helvetica', 'normal');
        doc.text(student.registerNo || 'N/A', 60, yOffset);
        yOffset += 8;
        doc.setFont('helvetica', 'bold');
        doc.text('ABC ID:', 10, yOffset);
        doc.setFont('helvetica', 'normal');
        doc.text(student.abcId || 'N/A', 60, yOffset);

        doc.setFont('helvetica', 'normal');
        doc.setLineWidth(0.5);
        doc.setDrawColor(0, 102, 204);
        doc.rect(160, candidateStartY, 30, 30); // Draw the box (same position as before)

        const padding = 1;
        const photoSize = 30 - 2 * padding;
        const photoX = 160 + padding;
        const photoY = candidateStartY + padding;

        if (student.photo) {
          // If photo exists, display it
          try {
            const photoUrl = `${this.baseUrl}${student.photo}`;
            console.log(`Fetching student photo from: ${photoUrl}`);
            const photoBase64 = await fetchImageAsBase64(photoUrl);
            if (!photoBase64) {
              throw new Error('Failed to fetch student photo: No data returned');
            }

            const mimeType = photoBase64.split(';')[0].split(':')[1];
            const imageFormat = mimeType.split('/')[1].toUpperCase();

            doc.addImage(photoBase64, imageFormat, photoX, photoY, photoSize, photoSize, undefined, 'NONE', 0);
            console.log(`[Frontend] Successfully added student photo to PDF for ${student.registerNo}`);
          } catch (error) {
            console.error(`[Frontend] Error adding student photo to PDF for ${student.registerNo}:`, error);
            // If photo fetch fails, show the "Paste your photo" text
            doc.setFontSize(8);
            doc.setTextColor(0, 0, 0);
            const textLines = doc.splitTextToSize('Paste your photo', 28);
            const textHeight = textLines.length * 4;
            const textY = candidateStartY + 15 - (textHeight / 2);
            doc.text(textLines, 161, textY);
            console.log(`[Frontend] Photo fetch failed, displaying "Paste your photo" placeholder for ${student.registerNo}`);
          }
        } else {
          // If no photo, display "Paste your photo" text in the center of the box
          doc.setFontSize(8);
          doc.setTextColor(0, 0, 0);
          const textLines = doc.splitTextToSize('Paste your photo', 28);
          const textHeight = textLines.length * 4;
          const textY = candidateStartY + 15 - (textHeight / 2);
          doc.text(textLines, 161, textY);
          console.log(`[Frontend] No photo available, displaying "Paste your photo" placeholder for ${student.registerNo}`);
        }

        doc.setLineWidth(0.2);
        doc.setDrawColor(0, 0, 0);

        doc.setFontSize(10);
        yOffset += 10;

        yOffset += 12;

        doc.setFontSize(12);
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
          course.courseCode || 'N/A',
          course.name || 'Unknown Course',
          course.examDate || 'N/A',
          course.examTime || 'N/A',
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
          'This is a proctored, in-person, computer-based examination of 120 minutes duration.',
          'A printed Hall Ticket is mandatory for entry. If the photo is unclear / not printed, a recent passport-size photo must be affixed in the designated space and attested by the HoD.',
          'Digital copies of the Hall Ticket on mobile phones or other devices will not be accepted.',
          'Original Institute ID card must be presented along with the Hall Ticket for verification.',
          'Candidates must report to the exam venue at least 15 minutes before the scheduled start time.',
          'Ensure eligibility and fee payment status are confirmed prior to entry.',
          'Formal dress code is mandatory.',
          'Candidates must bring their own pen, pencil, and eraser.',
          'All digital/electronic devices (including mobile phones, smart watches, etc.) and unauthorized printed or written materials are strictly prohibited inside the exam venue.',
          'White sheets will be provided upon request. Candidates must write their name and register number on each sheet before use. All sheets (used and unused) must be returned to the invigilator.',
          'Candidates must maintain proper code of conduct throughout the exam. Any form of misconduct will invite disciplinary action as deemed necessary by PSNO.',
          'In case of delays, interruptions, or suspension of the exam due to unforeseen circumstances, the PMIST SWAYAM Nodal Office (PSNO) will determine the appropriate course of action.'
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
        doc.text('PMIST SWAYAM Nodal Officer (PSNO)', 140, yOffset);
        yOffset += 25;

        doc.setFontSize(8);
        const footerY = 280;
        const currentDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/');
        doc.text(`Issued on: ${currentDate}`, 10, footerY);
        doc.text('Contact the PMIST SWAYAM Nodal Office for any discrepancies.', 10, footerY + 5);
      }

      const fileName = `hall_ticket_${studentId}_${this.selectedCourseId}.pdf`;
      console.log('[Frontend] Saving PDF as:', fileName);
      doc.save(fileName);
      console.log('[Frontend] PDF download triggered successfully');
    }
  },
  watch: {
    filteredStudents: {
      handler() {
        console.log('[Frontend] Filtered students updated, recalculating selected students...');
        this.updateSelectedStudents();
      },
      deep: true
    },
    selectedStudentIds: {
      handler() {
        console.log('[Frontend] Selected student IDs changed, updating select all state...');
        this.updateSelectedStudents();
      }
    }
  }
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
input[type="checkbox"] {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border: 2px solid #d1d5db;
  border-radius: 50%;
  background-color: white;
  cursor: pointer;
  position: relative;
}
input[type="checkbox"]:checked {
  background-color: #3b82f6;
  border-color: #3b82f6;
}
input[type="checkbox"]:checked::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  background-color: white;
  border-radius: 50%;
}
input[type="checkbox"]:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
}
input[type="checkbox"]:disabled {
  background-color: #e5e7eb;
  border-color: #d1d5db;
  cursor: not-allowed;
}
</style>
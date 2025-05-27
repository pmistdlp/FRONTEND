```vue
<template>
  <div class="space-y-6 p-4 bg-white text-gray-800">
    <div v-if="isLoading" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
      <div class="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid"></div>
      <p class="text-white ml-4">Processing...</p>
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
      <div class="overflow-x-auto">
        <table class="min-w-full bg-white border border-gray-200 rounded-md text-sm">
          <thead class="bg-gray-100">
            <tr>
              <th class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">
                <input type="checkbox" v-model="selectAllStudents" @change="toggleSelectAllStudents" class="h-4 w-4 rounded-full" />
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
              <tr v-for="student in enrolledStudents" :key="student.id" class="hover:bg-gray-50 transition-all duration-200">
                <td class="py-2 px-3 border-b border-gray-200">
                  <input type="checkbox" v-model="selectedStudentIds" :value="student.id" class="h-4 w-4 rounded-full" />
                </td>
                <td class="py-2 px-3 border-b border-gray-200">{{ student.name }}</td>
                <td class="py-2 px-3 border-b border-gray-200">{{ student.registerNo }}</td>
                <td class="py-2 px-3 border-b border-gray-200">{{ student.dob }}</td>
                <td class="py-2 px-3 border-b border-gray-200">{{ student.aadharNumber || '-' }}</td>
                <td class="py-2 px-3 border-b border-gray-200">{{ student.abcId || '-' }}</td>
                <td class="py-2 px-3 border-b border-gray-200">
                  <input type="checkbox" v-model="student.isEligible" class="h-4 w-4 rounded-full" />
                </td>
                <td class="py-2 px-3 border-b border-gray-200">
                  <input type="checkbox" v-model="student.paymentConfirmed" class="h-4 w-4 rounded-full" />
                </td>
                <td class="py-2 px-3 border-b border-gray-200">
                  <button @click="downloadHallTicketForStudent(student.id)" 
                          :disabled="!student.isEligible || !student.paymentConfirmed"
                          class="bg-indigo-500 text-white px-3 py-1 rounded-md hover:bg-indigo-600 disabled:bg-gray-400 transition-all duration-200 text-xs">
                    Hall Ticket
                  </button>
                </td>
              </tr>
            </transition-group>
          </tbody>
        </table>
      </div>
      <div class="mt-4 flex space-x-2">
        <button @click="saveStatusUpdates" 
                :disabled="selectedStudentIds.length === 0"
                class="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 disabled:bg-gray-400 transition-all duration-200 text-sm">
          Save Status Updates ({{ selectedStudentIds.length }})
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import apiConfig from '@/config/apiConfig';
import { defineComponent } from 'vue';
import { jsPDF } from 'jspdf';

// Import logo and signature images
import uletkzLogo from '@/images/uletkz.png';
import pmistLogo from '@/images/pmist.png';
import nodalOfficerSignature from '@/images/nodalofficer-signature.png';

// Create Axios instance without baseURL initially
const api = axios.create({ withCredentials: true });

export default defineComponent({
  name: 'AdminEnrollments',
  props: {
    user: { type: Object, required: true, default: () => ({}) },
  },
  data() {
    return {
      isLoading: false,
      courses: [],
      selectedCourseId: '',
      enrolledStudents: [],
      selectedStudentIds: [],
      selectAllStudents: false,
    };
  },
  async created() {
    console.log('[Frontend] Component created, initializing base URL...');
    try {
      const baseURL = await apiConfig.getBaseURL();
      api.defaults.baseURL = baseURL;
      console.log('[Frontend] Base URL set to:', baseURL);
    } catch (error) {
      console.error('[Frontend] Failed to fetch base URL:', error);
      api.defaults.baseURL = 'http://localhost:3000'; // Fallback
      console.log('[Frontend] Using fallback base URL:', api.defaults.baseURL);
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
        return;
      }
      console.log('[Frontend] Fetching students for course ID:', this.selectedCourseId);
      this.isLoading = true;
      try {
        const response = await api.get(`/api/admin-enrollments/students/${this.selectedCourseId}`);
        console.log('[Frontend] Students fetched:', response.data);
        this.enrolledStudents = response.data.map(student => ({
          ...student,
          originalIsEligible: student.isEligible, // Store original values
          originalPaymentConfirmed: student.paymentConfirmed
        }));
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
        this.selectedStudentIds = this.enrolledStudents
          .filter(student => student.isEligible && student.paymentConfirmed)
          .map(student => student.id);
        console.log('[Frontend] Selected all eligible students:', this.selectedStudentIds);
      } else {
        this.selectedStudentIds = [];
        console.log('[Frontend] Deselected all students');
      }
    },
    updateSelectedStudents() {
      console.log('[Frontend] Updating selected students based on eligibility and payment...');
      this.selectedStudentIds = this.enrolledStudents
        .filter(student => student.isEligible && student.paymentConfirmed)
        .map(student => student.id);
      this.selectAllStudents = this.selectedStudentIds.length === this.enrolledStudents.length && this.enrolledStudents.length > 0;
      console.log('[Frontend] Updated selected student IDs:', this.selectedStudentIds, 'Select all:', this.selectAllStudents);
    },
    async saveStatusUpdates() {
      if (this.selectedStudentIds.length === 0) {
        console.log('[Frontend] No students selected, skipping save...');
        return;
      }
      console.log('[Frontend] Saving status updates for students:', this.selectedStudentIds);
      this.isLoading = true;
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
        // Update original values after successful save
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
        // Revert changes on error
        this.enrolledStudents = this.enrolledStudents.map(student => ({
          ...student,
          isEligible: student.originalIsEligible,
          paymentConfirmed: student.originalPaymentConfirmed
        }));
        this.updateSelectedStudents();
      } finally {
        this.isLoading = false;
        console.log('[Frontend] Save status updates complete, loading state:', this.isLoading);
      }
    },
    async downloadHallTicketForStudent(studentId) {
      console.log('[Frontend] Initiating hall ticket download for student ID:', studentId);
      this.isLoading = true;
      try {
        const payload = {
          courseId: this.selectedCourseId,
          studentIds: [studentId]
        };
        console.log('[Frontend] Sending hall ticket request to backend:', payload);
        const response = await api.post('/api/admin-enrollments/hall-ticket', payload);
        console.log('[Frontend] Received hall ticket response:', response.data);
        const { hallTickets } = response.data;
        if (hallTickets.length === 0) {
          throw new Error('No hall ticket data returned from backend');
        }
        console.log('[Frontend] Hall tickets data:', hallTickets);
        this.generateHallTicketPDF(hallTickets);
      } catch (error) {
        const errorMsg = error.response?.data?.error || error.message;
        console.error('[Frontend] Error generating hall ticket:', errorMsg);
        alert(`Failed to generate hall ticket: ${errorMsg}`);
      } finally {
        this.isLoading = false;
        console.log('[Frontend] Hall ticket download process complete, loading state:', this.isLoading);
      }
    },
    generateHallTicketPDF(hallTickets) {
      console.log('[Frontend] Starting PDF generation with jsPDF for hall tickets:', hallTickets);
      const doc = new jsPDF();
      let yOffset = 10;

      hallTickets.forEach((ticket, index) => {
        const { student, course } = ticket;
        console.log(`[Frontend] Generating PDF content for hall ticket ${index + 1}, student: ${student.name}`);

        if (index > 0) {
          doc.addPage();
          yOffset = 10;
        }

        // Header with Logos and Text Aligned on the Same Line
        const logoY = yOffset; // Align logos and text block at the same y-position
        // Add Logos
        doc.addImage(uletkzLogo, 'PNG', 10, logoY, 30, 12); // Left logo
        doc.addImage(pmistLogo, 'PNG', 170, logoY, 30, 12); // Right logo, adjusted x-position

        // Text Block (Centered between logos)
        const textBlockStartX = 40; // Space after left logo
        const textBlockWidth = 130; // Space between logos (210 - 40 - 40)
        const textBlockCenterX = textBlockStartX + textBlockWidth / 2; // Center point for text

        yOffset += 4;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('CENTRE FOR ONLINE AND BLENDED LEARNING', textBlockCenterX, yOffset, { align: 'center' });
        yOffset += 6;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Periyar Maniammai Institute of Science & Technology', textBlockCenterX, yOffset, { align: 'center' });
        yOffset += 5;
        doc.text('Periyar Nagar, Vallam, Thanjavur - 613403', textBlockCenterX, yOffset, { align: 'center' });
        yOffset += 5;
        doc.text('www.moocs.pmu.edu', textBlockCenterX, yOffset, { align: 'center' });

        // Add Space Before Exam Title and Hall Ticket
        yOffset += 10;

        // Exam Title and Hall Ticket
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('END-TERM PROCTORED EXAMINATION, MAY - JUNE 2025', 105, yOffset, { align: 'center' });
        yOffset += 8;
        doc.setFontSize(16);
        doc.text('HALL TICKET', 105, yOffset, { align: 'center' });
        yOffset += 15;

        // Candidate Details with Photo Box Aligned
        const candidateStartY = yOffset; // Track starting y-position for alignment
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Name of the Candidate:', 10, yOffset);
        doc.setFont('helvetica', 'normal');
        doc.text(student.name, 60, yOffset);
        yOffset += 8;
        doc.setFont('helvetica', 'bold');
        doc.text('Register Number:', 10, yOffset);
        doc.setFont('helvetica', 'normal');
        doc.text(student.registerNo, 60, yOffset);
        yOffset += 8;
        doc.setFont('helvetica', 'bold');
        doc.text('ABC ID:', 10, yOffset);
        doc.setFont('helvetica', 'normal');
        doc.text(student.abcId || '-', 60, yOffset);

        // Photo Placeholder (Aligned with Candidate Details)
        doc.setFont('helvetica', 'normal');
        doc.rect(160, candidateStartY, 30, 30); // Box aligned with the start of candidate details
        doc.setFontSize(8); // Smaller font for the text inside the box
        const line1 = 'Paste your';
        const line2 = 'recent photo';
        const maxWidth = 26; // 30mm box width - 2mm left margin - 2mm right margin
        const line1Width = doc.getTextWidth(line1);
        const line2Width = doc.getTextWidth(line2);
        const line1X = 160 + (30 - line1Width) / 2; // Center first line
        const line2X = 160 + (30 - line2Width) / 2; // Center second line
        const line1Y = candidateStartY + 12; // First line, adjusted for vertical centering
        const line2Y = candidateStartY + 18; // Second line, 6mm below the first
        doc.text(line1, line1X, line1Y);
        doc.text(line2, line2X, line2Y);
        doc.setFontSize(10); // Reset font size
        yOffset += 10; // Space after candidate details

        // Extra Space Before Course Details
        yOffset += 12;

        // Course Details Table
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Course Details', 10, yOffset);
        yOffset += 6;
        doc.setLineWidth(0.2);
        doc.setDrawColor(0);
        doc.setFillColor(240, 240, 240);

        // Table Headers
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

        // Table Row
        doc.setFont('helvetica', 'normal');
        const rowData = [
          course.courseCode || '-',
          course.name,
          course.examDate,
          course.examTime,
          'PKC Lab 1' // Hardcoded venue as per PDF
        ];
        rowData.forEach((data, i) => {
          doc.text(data, tableX + tableWidths.slice(0, i).reduce((a, b) => a + b, 0) + 2, yOffset);
        });
        yOffset += 2;
        doc.line(tableX, yOffset, tableX + tableWidths.reduce((a, b) => a + b, 0), yOffset);
        yOffset += 10;

        // General Instructions
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('GENERAL INSTRUCTIONS', 10, yOffset);
        yOffset += 6;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const instructions = [
          'Hall Ticket (with recent passport-size photo) and original Institute ID Card must be presented for verification.',
          'Printed Hall Ticket with photo is mandatory. Digital copies on mobile phones or other devices will not be accepted.',
          'Ensure eligibility and fee payment status are confirmed prior to entry.',
          'Report to the exam venue at least 15 minutes before the exam starts.',
          'White sheets will be provided upon request. Candidates must write their name and register number on each sheet before use. All sheets (used/unused) must be returned to the invigilator after the exam.',
          'Formal dress code is mandatory.',
          'Candidates must bring their own pen, pencil, and eraser.',
          'Maintain proper code of conduct throughout the exam. PSNO reserves the right to take disciplinary action in case of misconduct.',
          'In case of delays due to unforeseen circumstances, PSNO will determine the appropriate course of action as it deems fit.',
          'All digital/electronic devices and unauthorized printed/written materials are strictly prohibited in the exam centre.'
        ];
        instructions.forEach(instruction => {
          // Draw a dark-filled circle as bullet
          doc.setFillColor(0, 0, 0); // Black fill
          doc.circle(12, yOffset - 1, 1, 'F'); // Filled circle (radius 1mm)
          const lines = doc.splitTextToSize(instruction, 175); // Adjusted width to account for bullet
          lines.forEach((line, lineIndex) => {
            doc.text(line, 16, yOffset); // Text starts after bullet
            yOffset += 5;
          });
        });
        yOffset += 12;

        // Signatures (Aligned and Equal Space)
        // Nodal Officer Signature (Above Text)
        const signatureStartY = yOffset; // Track starting y-position for signatures
        doc.addImage(nodalOfficerSignature, 'PNG', 160, signatureStartY, 40, 15); // Positioned above the text
        yOffset += 20; // Space for the signature image
        // Align both labels on the same line with adjusted font size for candidate
        doc.setFontSize(10); // Increased to visually match the signature image height
        doc.text('Signature of the Candidate', 10, yOffset);
        doc.setFontSize(10); // Reset to default for nodal officer text
        doc.text('PMIST SWAYAM Nodal Officer (PSNO)', 140, yOffset);
        doc.setFontSize(10); // Ensure font size is reset for subsequent text
        yOffset += 25; // Equal space for both candidate and nodal officer to sign

        // Footer (At bottom of the page)
        doc.setFontSize(8);
        const footerY = 280; // Near bottom of A4 page (297mm height)
        const currentDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/');
        doc.text(`Issued on: ${currentDate}`, 10, footerY);
        doc.text('Contact the PMIST SWAYAM Nodal Office for any discrepancies.', 10, footerY + 5);
        doc.text(`Page ${index + 1} of ${hallTickets.length}`, 190, footerY + 5, { align: 'right' });
      });

      const fileName = `hall_ticket_${this.selectedCourseId}_${hallTickets[0].student.id}.pdf`;
      console.log('[Frontend] Saving PDF as:', fileName);
      doc.save(fileName);
      console.log('[Frontend] PDF download triggered successfully');
    }
  },
  watch: {
    enrolledStudents() {
      console.log('[Frontend] Enrolled students updated, recalculating selected students...');
      this.updateSelectedStudents();
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
```
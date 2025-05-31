import axios from 'axios';
import apiConfig from '@/config/apiConfig';
import { jsPDF } from 'jspdf';
import uletkzLogo from '@/images/uletkz.png';
import pmistLogo from '@/images/pmist.png';
import nodalOfficerSignature from '@/images/nodalofficer-signature.png';
import { ref } from 'vue';

// Utility to fetch image as base64 in a browser environment
async function fetchImageAsBase64(url) {
  console.log(`[Frontend] Attempting to fetch image from: ${url}`);
  const startTime = Date.now();
  try {
    const response = await axios.get(url, { responseType: 'blob', withCredentials: true });
    console.log(`[Frontend] Image fetch successful, status: ${response.status}, response size: ${response.data.size} bytes`);

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
    console.error('[Frontend] Error fetching image:', error.message);
    if (error.response) {
      console.error(`[Frontend] HTTP Status: ${error.response.status}, Status Text: ${error.response.statusText}`);
      throw new Error(`Failed to fetch image (HTTP ${error.response.status}): Please ensure your profile photo is uploaded correctly.`);
    } else if (error.request) {
      console.error('[Frontend] No response received from server. Possible network or CORS issue.');
      throw new Error(`Failed to fetch image: No response from server. Please check your network connection.`);
    } else {
      console.error('[Frontend] Error setting up the request:', error.message);
      throw new Error(`Failed to fetch image: Please upload a valid image (e.g., JPG, PNG, WebP).`);
    }
  }
}

export function useHallTicketFeatures(studentIdRef, emit) {
  const isDownloading = ref(false);
  const baseUrl = ref('');

  // Initialize base URL
  async function initializeBaseUrl() {
    try {
      const baseURL = await apiConfig.getBaseURL();
      baseUrl.value = baseURL;
      console.log('[Frontend] Base URL set to:', baseURL);
    } catch (error) {
      console.error('[Frontend] Failed to fetch base URL:', error);
      baseUrl.value = process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000';
      console.log('[Frontend] Using fallback base URL:', baseUrl.value);
    }
  }

  // Download hall ticket
  async function downloadHallTicketForStudent(courseId) {
    const studentId = studentIdRef.value;
    console.log(`[Frontend] Initiating hall ticket download for student ID: ${studentId}, Course ID: ${courseId}`);
    console.log(`[Frontend] Using base URL: ${baseUrl.value}`);
    
    if (!studentId || !courseId) {
      console.error('[Frontend] Invalid studentId or courseId provided', { studentId, courseId });
      emit('show-message', {
        message: 'Failed to generate hall ticket: Invalid student or course ID',
        type: 'error'
      });
      return;
    }

    isDownloading.value = true;
    try {
      const payload = { courseId, studentId };
      console.log('[Frontend] Sending hall ticket request to backend:', payload);
      const response = await axios.post(`${baseUrl.value}/api/student-courses/hall-ticket`, payload, { withCredentials: true });
      console.log('[Frontend] Received hall ticket response:', response.data);
      const { hallTickets } = response.data;
      if (!hallTickets || hallTickets.length === 0) {
        throw new Error('No hall ticket data returned from backend');
      }
      console.log('[Frontend] Hall tickets student data:', hallTickets.map(ticket => ticket.student));
      console.log('[Frontend] Full hall tickets data:', JSON.stringify(hallTickets, null, 2));

      await generateHallTicketPDF(hallTickets, studentId, courseId);
      emit('show-message', {
        message: 'Hall ticket downloaded successfully',
        type: 'success'
      });
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      console.error('[Frontend] Error generating hall ticket:', errorMsg);
      emit('show-message', {
        message: `Failed to generate hall ticket: ${errorMsg}`,
        type: 'error'
      });
    } finally {
      isDownloading.value = false;
      console.log('[Frontend] Hall ticket download process complete, downloading state:', isDownloading.value);
    }
  }

  // Generate hall ticket PDF
  async function generateHallTicketPDF(hallTickets, studentId, courseId) {
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
        doc.save(`hall_ticket_error_${studentId}_${courseId}.pdf`);
        throw new Error('Course data is missing in hall ticket');
      }

      if (index > 0) {
        doc.addPage();
        yOffset = 10;
      }

      // Header with Logos and Text
      const logoY = yOffset;
      try {
        doc.addImage(uletkzLogo, 'PNG', 10, logoY, 30, 12);
        doc.addImage(pmistLogo, 'PNG', 170, logoY, 30, 12);
      } catch (error) {
        console.error('[Frontend] Error adding logos to PDF:', error);
        throw new Error('Failed to load logos for hall ticket.');
      }

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

      // Photo Box with Border and Padding
      doc.setLineWidth(0.5);
      doc.setDrawColor(0, 102, 204);
      doc.rect(160, candidateStartY, 30, 30);

      const padding = 1;
      const photoSize = 30 - 2 * padding;
      const photoX = 160 + padding;
      const photoY = candidateStartY + padding;

      if (student.photo) {
        try {
          const photoUrl = `${baseUrl.value}${student.photo}`;
          console.log(`[Frontend] Fetching student photo from: ${photoUrl}`);
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
          doc.setFontSize(8);
          doc.setTextColor(0, 0, 0);
          const textLines = doc.splitTextToSize('Paste your photo', 28);
          const textHeight = textLines.length * 4;
          const textY = candidateStartY + 15 - (textHeight / 2);
          doc.text(textLines, 161, textY);
          console.log(`[Frontend] Photo fetch failed, displaying "Paste your photo" placeholder for ${student.registerNo}`);
        }
      } else {
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
      try {
        doc.addImage(nodalOfficerSignature, 'PNG', 160, signatureStartY, 40, 15);
      } catch (error) {
        console.error('[Frontend] Error adding signature to PDF:', error);
        throw new Error('Failed to load nodal officer signature.');
      }
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

    const fileName = `hall_ticket_${studentId}_${courseId}.pdf`;
    console.log('[Frontend] Saving PDF as:', fileName);
    doc.save(fileName);
    console.log('[Frontend] PDF download triggered successfully');
  }

  initializeBaseUrl();

  return {
    isDownloading,
    downloadHallTicketForStudent,
  };
}
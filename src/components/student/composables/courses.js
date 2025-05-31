import { ref } from 'vue';
import axios from 'axios';

export function useCourses() {
  const courses = ref([]);
  const student = ref({});
  const isLoading = ref(false);
  const errorMessage = ref('');

  const fetchCourses = async (studentId) => {
    if (!studentId) {
      errorMessage.value = 'Student ID is required';
      console.error('[useCourses] Student ID is missing');
      return;
    }

    isLoading.value = true;
    errorMessage.value = '';
    try {
      console.log(`[useCourses] Fetching courses for studentId: ${studentId}`);
      const response = await axios.get(`/api/student-courses/complete-details/${studentId}`, {
        withCredentials: true,
      });

      console.log('[useCourses] API response:', response.data);

      // Store student details
      student.value = {
        id: response.data.student.id,
        name: response.data.student.name,
        registerNo: response.data.student.registerNo,
        abcId: response.data.student.abcId,
        photo: response.data.student.photo,
      };

      // Store courses
      courses.value = response.data.courses.map((course) => ({
        id: course.courseid,
        name: course.coursename,
        courseCode: course.coursecode,
        learningPlatform: course.learningplatform,
        examDate: course.examdate,
        examTime: course.examtime,
        examQuestionCount: course.examquestioncount,
        examMarks: course.exammarks,
        coCount: course.cocount,
        isRegistrationOpen: course.isregistrationopen,
        isDraft: course.isdraft,
        isEligible: course.iseligible,
        paymentConfirmed: course.paymentconfirmed,
        startDate: course.startdate,
        startTime: course.starttime,
        hasCompleted: course.hascompleted,
        hasMalpractice: course.hasmalpractice,
        hasExited: course.hasexited,
      }));

      console.log(`[useCourses] Successfully fetched ${courses.value.length} courses for studentId: ${studentId}`);
    } catch (error) {
      console.error('[useCourses] Error fetching courses:', error.response?.data || error.message);
      errorMessage.value = error.response?.data?.error || 'Failed to load courses. Please try again.';
    } finally {
      isLoading.value = false;
    }
  };

  return {
    courses,
    student,
    isLoading,
    errorMessage,
    fetchCourses,
  };
}
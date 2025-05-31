import moment from 'moment-timezone';
import axios from 'axios';
import apiConfig from '@/config/apiConfig';
import { ref, computed, watch, onMounted, onUpdated, onBeforeUnmount, nextTick } from 'vue';
import { useHallTicketFeatures } from './hallTicketFeatures';

// Debounce function to limit frequent calls
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Retry function with exponential backoff
async function retryOperation(operation, maxRetries = 5, baseDelay = 600) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) {
        console.error(`Operation failed after ${maxRetries} attempts:`, error.response?.data || error.message);
        throw error;
      }
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.warn(`Retry attempt ${attempt} failed, retrying in ${delay}ms:`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

export function useCourseFeatures(props, emit) {
  const api = axios.create({ withCredentials: true });

  // Reactive state
  const selectedCourse = ref(null);
  const questions = ref({ phase1: [], phase2: [] });
  const isQuestionsLoading = ref(false);
  const questionsLoaded = ref(false);
  const questionsError = ref('');
  const mathJaxLoaded = ref(false);
  const mathJaxFailed = ref(false);
  const mutationObserver = ref(null);
  const selectedAnswers = ref({});
  const questionStatuses = ref({});
  const currentPhase = ref(null);
  const currentQuestionIndex = ref(null);
  const remainingTime = ref(7200);
  const timerInterval = ref(null);
  const examStartedAt = ref(null);
  const showExitModalFlag = ref(false);
  const isExamStarted = ref(false);
  const showMalpracticeWarning = ref(false);
  const malpracticeAttempts = ref({ right_click: 0, screenshot_key: 0, other: 0 });
  const hasMalpractice = ref(false);
  const isRestricted = ref(false);
  const isHallTicketRestricted = ref(false);
  const baseUrl = ref('');
  const examResults = ref(null);
  const showResultsView = ref(false);
  const examStatus = ref({});
  const pendingSubmissions = ref([]);
  const submittedAnswers = ref([]);
  const isExamPaused = ref(false);

  const { isDownloading, downloadHallTicketForStudent } = useHallTicketFeatures(computed(() => props.user?.id), emit);

  const debouncedTypesetMathJax = debounce(() => {
    typesetMathJax();
  }, 300);

  const canSubmit = computed(() => {
    const allQuestions = [...questions.value.phase1, ...questions.value.phase2];
    return allQuestions.every(question => questionStatuses.value[question.id] === 'submitted');
  });

  const currentQuestion = computed(() => {
    if (!currentPhase.value || currentQuestionIndex.value === null || !questions.value[currentPhase.value]) return null;
    return questions.value[currentPhase.value][currentQuestionIndex.value] || null;
  });

  const currentQuestionIndexInAll = computed(() => {
    if (!currentPhase.value || currentQuestionIndex.value === null) return -1;
    if (currentPhase.value === 'phase1') {
      return currentQuestionIndex.value;
    } else {
      return questions.value.phase1.length + currentQuestionIndex.value;
    }
  });

  const studentId = computed(() => props.user?.id);

  // Fetch courses for the student
  async function fetchCourses() {
    if (!studentId.value) {
      console.error(`[${new Date().toISOString()}] [courseFeatures.js] No student ID available to fetch courses`);
      emit('show-message', 'Please log in to access your courses.');
      return;
    }
    try {
      const baseURL = await apiConfig.getBaseURL();
      const url = `/api/student-courses/complete-details/${studentId.value}`;
      console.log(`[${new Date().toISOString()}] [courseFeatures.js] Fetching courses from: ${baseURL}${url} for student ID ${studentId.value}`);
      const response = await retryOperation(() => api.get(url));
      const { courses: fetchedCourses } = response.data;
      console.log(`[${new Date().toISOString()}] [courseFeatures.js] Fetched ${fetchedCourses.length} courses for student ID ${studentId.value}`, fetchedCourses);

      // Validate and map courses
      const mappedCourses = fetchedCourses
        .filter(course => {
          if (!course.courseid || !course.coursename) {
            console.warn(`[${new Date().toISOString()}] [courseFeatures.js] Invalid course data:`, course);
            return false;
          }
          return true;
        })
        .map(course => {
          const mappedCourse = {
            id: course.courseid,
            name: course.coursename.trim(), // Trim trailing spaces
            courseCode: course.coursecode || 'N/A',
            learningPlatform: course.learningplatform || 'N/A',
            examDate: course.examdate || 'N/A',
            examTime: course.examtime || 'N/A',
            examQuestionCount: course.examquestioncount || 0,
            examMarks: course.exammarks || 0,
            coCount: course.cocount || 0,
            isRegistrationOpen: course.isregistrationopen ?? false,
            isEligible: course.iseligible ?? false,
            paymentConfirmed: course.paymentconfirmed ?? false,
            startDate: course.startdate || 'N/A',
            startTime: course.starttime || 'N/A',
            hasCompleted: course.hascompleted ?? false,
            hasMalpractice: course.hasmalpractice ?? false,
            hasExited: course.hasexited ?? false,
            isDraft: course.isdraft ?? false,
            duration: course.examduration || 120, // Assume default duration if not provided
            student: {
              id: studentId.value,
              registerNo: props.user?.registerNo || `STU${studentId.value}`,
              name: props.user?.name || 'Student'
            }
          };
          console.log(`[${new Date().toISOString()}] [courseFeatures.js] Mapped course ${mappedCourse.id}:`, mappedCourse);
          return mappedCourse;
        });

      console.log(`[${new Date().toISOString()}] [courseFeatures.js] Emitting ${mappedCourses.length} courses`);
      emit('update:courses', mappedCourses);

      // Update exam status
      updateExamStatus();

      if (mappedCourses.length === 0) {
        console.warn(`[${new Date().toISOString()}] [courseFeatures.js] No valid courses returned for student ID ${studentId.value}. Checking database...`);
        const studentCoursesCheck = await api.get(`/api/student-courses/complete-details/${studentId.value}?showDrafts=true`);
        console.log(`[${new Date().toISOString()}] [courseFeatures.js] Debug: Found ${studentCoursesCheck.data.courses.length} course assignments (including drafts):`, studentCoursesCheck.data.courses);
        emit('show-message', 'No courses assigned to you. Please contact the administrator or check your enrollment status.');
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] [courseFeatures.js] Error fetching courses for student ID ${studentId.value}:`, error.response?.data || error.message);
      let errorMessage = 'Failed to fetch courses. Please try again later.';
      if (error.response?.status === 404) {
        errorMessage = 'Student not found or no courses assigned. Please verify your enrollment.';
      } else if (error.response?.data?.error) {
        errorMessage = `Failed to fetch courses: ${error.response.data.error}`;
      }
      emit('show-message', errorMessage);
    }
  }

  function saveAnswersToCache() {
    if (!selectedCourse.value || !studentId.value) return;
    const cacheKey = `exam_${studentId.value}_${selectedCourse.value.id}`;
    const cacheData = {
      selectedAnswers: selectedAnswers.value,
      questionStatuses: questionStatuses.value,
      examStartedAt: examStartedAt.value,
      pendingSubmissions: pendingSubmissions.value,
      submittedAnswers: submittedAnswers.value,
    };
    try {
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log(`[${new Date().toISOString()}] [courseFeatures.js] Answers saved to cache:`, cacheData);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] [courseFeatures.js] Error saving to cache:`, error);
    }
  }

  function restoreAnswersFromCache() {
    if (!selectedCourse.value || !studentId.value) return;
    const cacheKey = `exam_${studentId.value}_${selectedCourse.value.id}`;
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      try {
        const { selectedAnswers: cachedAnswers, questionStatuses: cachedStatuses, examStartedAt: cachedStart, pendingSubmissions: cachedPending, submittedAnswers: cachedSubmitted } = JSON.parse(cachedData);
        const allQuestionIds = [...questions.value.phase1, ...questions.value.phase2].map(q => q.id);
        selectedAnswers.value = Object.keys(cachedAnswers)
          .filter(id => allQuestionIds.includes(id))
          .reduce((obj, id) => ({ ...obj, [id]: cachedAnswers[id] }), {});
        questionStatuses.value = Object.keys(cachedStatuses)
          .filter(id => allQuestionIds.includes(id))
          .reduce((obj, id) => ({ ...obj, [id]: cachedStatuses[id] }), {});
        examStartedAt.value = cachedStart;
        pendingSubmissions.value = cachedPending || [];
        submittedAnswers.value = cachedSubmitted || [];
        console.log(`[${new Date().toISOString()}] [courseFeatures.js] Answers restored from cache:`, { selectedAnswers: selectedAnswers.value, questionStatuses: questionStatuses.value });
        retryPendingSubmissions();
      } catch (error) {
        console.error(`[${new Date().toISOString()}] [courseFeatures.js] Error restoring cache:`, error);
        clearCache();
      }
    }
  }

  function clearCache() {
    if (!selectedCourse.value || !studentId.value) return;
    const cacheKey = `exam_${studentId.value}_${selectedCourse.value.id}`;
    localStorage.removeItem(cacheKey);
    console.log(`[${new Date().toISOString()}] [courseFeatures.js] Cache cleared for:`, cacheKey);
    pendingSubmissions.value = [];
    submittedAnswers.value = [];
  }

  async function retryPendingSubmissions() {
    if (pendingSubmissions.value.length === 0) return;
    const submissions = [...pendingSubmissions.value];
    pendingSubmissions.value = [];
    for (const submission of submissions) {
      try {
        if (submission.answers) {
          if (!submission.studentId || !submission.courseId || !submission.answers) {
            console.error(`[${new Date().toISOString()}] [courseFeatures.js] Invalid pending exam submission:`, submission);
            continue;
          }
          await retryOperation(() => api.post('/api/student-courses/submit-exam', submission));
          console.log(`[${new Date().toISOString()}] [courseFeatures.js] Pending exam submitted for studentId ${submission.studentId}, courseId ${submission.courseId}`);
        } else {
          if (!submission.studentId || !submission.courseId || !submission.questionId || !submission.selectedAnswer) {
            console.error(`[${new Date().toISOString()}] [courseFeatures.js] Invalid pending answer submission:`, submission);
            continue;
          }
          await retryOperation(() => api.post('/api/student-courses/submit-answer', submission));
          console.log(`[${new Date().toISOString()}] [courseFeatures.js] Pending answer submitted for question ${submission.questionId}`);
          submittedAnswers.value.push({
            questionId: submission.questionId,
            answer: submission.selectedAnswer,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error(`[${new Date().toISOString()}] [courseFeatures.js] Failed to retry submission:`, error.response?.data || error.message);
        pendingSubmissions.value.push(submission);
      }
    }
    saveAnswersToCache();
  }

  watch(
    () => selectedCourse.value,
    (newVal, oldVal) => {
      if (newVal && (!oldVal || newVal.id !== oldVal.id)) {
        nextTick(() => debouncedTypesetMathJax());
      }
    }
  );

  watch(
    questions,
    () => {
      nextTick(() => debouncedTypesetMathJax());
    },
    { deep: true }
  );

  watch(
    currentQuestion,
    () => {
      nextTick(() => debouncedTypesetMathJax());
    }
  );

  watch(
    isExamStarted,
    (newVal) => {
      emit('exam-status-changed', newVal);
      emit('toggle-dashboard', newVal);
      console.log(`[${new Date().toISOString()}] [courseFeatures.js] Exam status updated:`, newVal);
      console.log(`[${new Date().toISOString()}] [courseFeatures.js] Dashboard visibility toggled, isExamActive:`, newVal);
      if (newVal) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
  );

  watch(
    () => props.courses,
    (newVal) => {
      console.log(`[${new Date().toISOString()}] [courseFeatures.js] Courses prop updated:`, newVal);
      updateExamStatus();
    },
    { deep: true }
  );

  watch(
    [selectedAnswers, questionStatuses, pendingSubmissions, submittedAnswers],
    () => {
      saveAnswersToCache();
    },
    { deep: true }
  );

  watch(
    showMalpracticeWarning,
    (newVal) => {
      isExamPaused.value = newVal;
      if (newVal && timerInterval.value) {
        clearInterval(timerInterval.value);
      } else if (!newVal && isExamStarted.value) {
        startTimer();
      }
    }
  );

  async function initializeBaseUrl() {
    try {
      const baseURL = await apiConfig.getBaseURL();
      api.defaults.baseURL = baseURL;
      baseUrl.value = baseURL;
      console.log(`[${new Date().toISOString()}] [courseFeatures.js] Base URL set to:`, baseURL);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] [courseFeatures.js] Failed to fetch base URL:`, error);
      api.defaults.baseURL = process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000';
      baseUrl.value = api.defaults.baseURL;
      console.log(`[${new Date().toISOString()}] [courseFeatures.js] Using fallback base URL:`, api.defaults.baseURL);
    }
  }

  function isEligible(course) {
    if (!course?.isEligible) {
      console.log(`[${new Date().toISOString()}] [courseFeatures.js] Course ${course?.id} is not eligible for student ${studentId.value}`);
      emit('show-message', 'You are not eligible to take this exam.');
      return false;
    }
    return true;
  }

  function isPaymentConfirmed(course) {
    if (!course?.paymentConfirmed) {
      console.log(`[${new Date().toISOString()}] [courseFeatures.js] Payment not confirmed for course ${course?.id} for student ${studentId.value}`);
      emit('show-message', 'Payment not confirmed for this exam.');
      return false;
    }
    return true;
  }

  async function isWithinTimeWindow(course) {
    if (!course?.examDate || !course?.examTime || course.examDate === 'N/A' || course.examTime === 'N/A') {
      console.log(`[${new Date().toISOString()}] [courseFeatures.js] Course ${course?.id} has no valid examDate or examTime, allowing exam start for debugging`);
      return true;
    }
    const now = await fetchISTTime();
    const examDateTime = moment.tz(
      `${course.examDate} ${course.examTime}`,
      'YYYY-MM-DD HH:mm',
      'Asia/Kolkata'
    );
    const windowStart = examDateTime;
    const windowEnd = examDateTime.clone().add(150, 'minutes');

    const isSameDate = now.isSame(examDateTime, 'day');
    const isWithinTime = now.isBetween(windowStart, windowEnd, null, '[]');
    const isBeforeStart = now.isBefore(windowStart);
    const isAfterEnd = now.isAfter(windowEnd);

    console.log(`[${new Date().toISOString()}] [courseFeatures.js] Checking time window for course ${course.id}:`, {
      now: now.format(),
      examDateTime: examDateTime.format(),
      windowStart: windowStart.format(),
      windowEnd: windowEnd.format(),
      isSameDate,
      isWithinTime,
      isBeforeStart,
      isAfterEnd
    });

    if (!isSameDate || isBeforeStart) {
      examStatus.value[course.id] = 'Exam Not Yet Started';
      isRestricted.value = true;
      return false;
    } else if (isAfterEnd) {
      examStatus.value[course.id] = 'Exam Elapsed';
      isRestricted.value = true;
      return false;
    } else if (isWithinTime) {
      isRestricted.value = false;
      return true;
    }
    isRestricted.value = true;
    return false;
  }

  async function fetchISTTime() {
    try {
      const response = await axios.get('https://api.api-ninjas.com/v1/worldtime?city=delhi', {
        headers: { 'X-Api-Key': process.env.VUE_APP_API_NINJAS_KEY || 'YOUR_API_NINJAS_KEY' }
      });
      return moment.tz(response.data.datetime, 'Asia/Kolkata');
    } catch (error) {
      console.error(`[${new Date().toISOString()}] [courseFeatures.js] Failed to fetch IST time:`, error.message);
      console.warn(`[${new Date().toISOString()}] [courseFeatures.js] Using local machine IST time as fallback`);
      return moment.tz('Asia/Kolkata');
    }
  }

  function updateExamStatus() {
    props.courses.forEach(async (course) => {
      console.log(`[${new Date().toISOString()}] [courseFeatures.js] [updateExamStatus] Checking status for course ${course.id} (${course.name})`);
      if (course.hasCompleted && !course.hasMalpractice) {
        examStatus.value[course.id] = 'Exam completed successfully';
        console.log(`[${new Date().toISOString()}] [courseFeatures.js] Course ${course.id} status: Exam completed successfully`);
      } else if (course.hasMalpractice) {
        examStatus.value[course.id] = 'Your Exam Auto Evaluated';
        console.log(`[${new Date().toISOString()}] [courseFeatures.js] Course ${course.id} status: Your Exam Auto Evaluated`);
      } else if (course.hasExited) {
        examStatus.value[course.id] = 'You Have Exited from Exam';
        console.log(`[${new Date().toISOString()}] [courseFeatures.js] Course ${course.id} status: You Have Exited from Exam`);
      } else {
        await isWithinTimeWindow(course);
        console.log(`[${new Date().toISOString()}] [courseFeatures.js] Course ${course.id} status: ${examStatus.value[course.id] || 'Pending time window check'}`);
      }
    });
  }

  async function attemptStartExam(course) {
    if (!course) return;
    console.log(`[${new Date().toISOString()}] [courseFeatures.js] Attempting to start exam for course ${course.id} (${course.name})`);
    if (course.hasCompleted || course.hasMalpractice || course.hasExited) {
      emit('show-message', examStatus.value[course.id] || 'Exam not available.');
      console.log(`[${new Date().toISOString()}] [courseFeatures.js] Cannot start exam for course ${course.id}: Already completed, malpractice, or exited`);
      return;
    }
    if (!isEligible(course) || !isPaymentConfirmed(course) || !(await isWithinTimeWindow(course))) {
      emit('show-message', examStatus.value[course.id] || 'Exam not available.');
      console.log(`[${new Date().toISOString()}] [courseFeatures.js] Cannot start exam for course ${course.id}: Not eligible, payment not confirmed, or outside time window`);
      return;
    }
    isExamStarted.value = true;
    await enterFullScreen();
    await startExam(course);
    setupMalpracticePrevention();
  }

  async function enterFullScreen() {
    try {
      const element = document.documentElement;
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if (element.mozRequestFullScreen) {
        await element.mozRequestFullScreen();
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen();
      } else if (element.msRequestFullscreen) {
        await element.msRequestFullscreen();
      }
      console.log(`[${new Date().toISOString()}] [courseFeatures.js] Entered full-screen mode`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] [courseFeatures.js] Failed to enter full-screen mode:`, error);
      emit('show-message', 'Failed to enter full-screen mode. Please try again.');
    }
  }

  async function exitFullScreen() {
    try {
      if (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
          await document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          await document.msExitFullscreen();
        }
        console.log(`[${new Date().toISOString()}] [courseFeatures.js] Exited full-screen mode`);
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] [courseFeatures.js] Failed to exit full-screen mode:`, error);
    }
  }

  async function startExam(course) {
    selectedCourse.value = course;
    console.log(`[${new Date().toISOString()}] [courseFeatures.js] Starting exam for course:`, course);
    isQuestionsLoading.value = true;
    questionsLoaded.value = false;
    questionsError.value = '';
    questions.value = { phase1: [], phase2: [] };
    selectedAnswers.value = {};
    questionStatuses.value = {};
    currentPhase.value = null;
    currentQuestionIndex.value = null;
    remainingTime.value = 7200;
    examStartedAt.value = new Date().toISOString();
    isRestricted.value = false;
    examResults.value = null;
    showResultsView.value = false;
    malpracticeAttempts.value = { right_click: 0, screenshot_key: 0, other: 0 };
    hasMalpractice.value = false;
    showMalpracticeWarning.value = false;
    pendingSubmissions.value = [];
    submittedAnswers.value = [];
    isExamPaused.value = false;

    startTimer();

    try {
      const baseURL = await apiConfig.getBaseURL();
      const url = `/api/student-courses/questions/${course.id}`;
      console.log(`[${new Date().toISOString()}] [courseFeatures.js] Fetching questions from: ${baseURL}${url}`);
      const response = await retryOperation(() => api.get(url));
      questions.value = {
        phase1: response.data.phase1 || [],
        phase2: response.data.phase2 || [],
      };
      console.log(`[${new Date().toISOString()}] [courseFeatures.js] Loaded questions:`, questions.value);

      [...questions.value.phase1, ...questions.value.phase2].forEach(question => {
        if (question?.id) {
          selectedAnswers.value[question.id] = selectedAnswers.value[question.id] || null;
          questionStatuses.value[question.id] = questionStatuses.value[question.id] || 'default';
        }
      });

      restoreAnswersFromCache();
      await retryPendingSubmissions();

      if (questions.value.phase1.length > 0) {
        currentPhase.value = 'phase1';
        currentQuestionIndex.value = 0;
      } else if (questions.value.phase2.length > 0) {
        currentPhase.value = 'phase2';
        currentQuestionIndex.value = 0;
      }

      await nextTick(() => debouncedTypesetMathJax());
    } catch (error) {
      console.error(`[${new Date().toISOString()}] [courseFeatures.js] Error fetching questions:`, error.response?.data || error.message);
      questionsError.value = `Failed to fetch questions: ${error.response?.data?.error || error.message}`;
      emit('show-message', questionsError.value);
    } finally {
      isQuestionsLoading.value = false;
      questionsLoaded.value = true;
    }
  }

  function startTimer() {
    if (timerInterval.value) clearInterval(timerInterval.value);
    if (isExamPaused.value) return;
    timerInterval.value = setInterval(() => {
      if (remainingTime.value > 0) {
        remainingTime.value--;
      } else {
        examStatus.value[selectedCourse.value?.id] = 'Exam Elapsed';
        submitExam(true);
      }
    }, 1000);
  }

  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  function goBackToCourses() {
    if (timerInterval.value) clearInterval(timerInterval.value);
    selectedCourse.value = null;
    questions.value = { phase1: [], phase2: [] };
    isQuestionsLoading.value = false;
    questionsLoaded.value = false;
    questionsError.value = '';
    selectedAnswers.value = {};
    questionStatuses.value = {};
    currentPhase.value = null;
    currentQuestionIndex.value = null;
    remainingTime.value = 7200;
    examStartedAt.value = null;
    showExitModalFlag.value = false;
    isExamStarted.value = false;
    malpracticeAttempts.value = { right_click: 0, screenshot_key: 0, other: 0 };
    showMalpracticeWarning.value = false;
    hasMalpractice.value = false;
    isRestricted.value = false;
    examResults.value = null;
    showResultsView.value = false;
    isExamPaused.value = false;
    clearCache();
    removeMalpracticePrevention();
    exitFullScreen();
  }

  function showExitModal() {
    showExitModalFlag.value = true;
  }

  async function confirmExit() {
    examStatus.value[selectedCourse.value?.id] = 'You Have Exited from Exam';
    const courseIndex = props.courses.findIndex(c => c.id === selectedCourse.value?.id);
    if (courseIndex !== -1) {
      props.courses[courseIndex] = {
        ...props.courses[courseIndex],
        hasExited: true,
      };
    }
    await submitExam(true);
    saveAnswersToCache();
    goBackToCourses();
  }

  function selectQuestion(phase, index) {
    if (!questions.value[phase]?.[index]) return;
    currentPhase.value = phase;
    currentQuestionIndex.value = index;
    nextTick(() => debouncedTypesetMathJax());
  }

  function navigatePrevious() {
    const allQuestions = [...questions.value.phase1, ...questions.value.phase2];
    const currentIndex = currentQuestionIndexInAll.value;
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      if (newIndex < questions.value.phase1.length) {
        currentPhase.value = 'phase1';
        currentQuestionIndex.value = newIndex;
      } else {
        currentPhase.value = 'phase2';
        currentQuestionIndex.value = newIndex - questions.value.phase1.length;
      }
      nextTick(() => debouncedTypesetMathJax());
    }
  }

  function navigateNext() {
    const allQuestions = [...questions.value.phase1, ...questions.value.phase2];
    const currentIndex = currentQuestionIndexInAll.value;
    if (currentIndex < allQuestions.length - 1) {
      const newIndex = currentIndex + 1;
      if (newIndex < questions.value.phase1.length) {
        currentPhase.value = 'phase1';
        currentQuestionIndex.value = newIndex;
      } else {
        currentPhase.value = 'phase2';
        currentQuestionIndex.value = newIndex - questions.value.phase1.length;
      }
      nextTick(() => debouncedTypesetMathJax());
    }
  }

  function getCircleClass(questionId) {
    if (!questionId) return 'bg-gray-200 text-gray-600';
    const status = questionStatuses.value[questionId];
    if (status === 'review') {
      return 'bg-orange-500 text-white';
    } else if (status === 'submitted') {
      return 'bg-green-500 text-white';
    } else {
      return 'bg-white text-purple-600 border-2 border-purple-600';
    }
  }

  function selectOption(questionId, option) {
    if (questionStatuses.value[questionId] === 'submitted' || isExamPaused.value) return;
    selectedAnswers.value[questionId] = option;
    console.log(`[${new Date().toISOString()}] [courseFeatures.js] Selected answers:`, selectedAnswers.value);
    saveAnswersToCache();
  }

  function markForReview(questionId) {
    if (questionStatuses.value[questionId] === 'submitted' || isExamPaused.value) return;
    questionStatuses.value[questionId] = 'review';
    console.log(`[${new Date().toISOString()}] [courseFeatures.js] Question statuses:`, questionStatuses.value);
    saveAnswersToCache();
    navigateNext();
  }

  async function submitAnswer(questionId) {
    if (isExamPaused.value) return;
    if (!selectedAnswers.value[questionId]) {
      emit('show-message', 'Please select an option before submitting.');
      return;
    }
    const submission = {
      studentId: studentId.value,
      courseId: selectedCourse.value?.id,
      questionId,
      selectedAnswer: selectedAnswers.value[questionId],
    };
    if (!submission.studentId || !submission.courseId || !submission.questionId || !submission.selectedAnswer) {
      console.error(`[${new Date().toISOString()}] [courseFeatures.js] Invalid submission data:`, submission);
      emit('show-message', 'Invalid submission data. Please try again.');
      return;
    }
    questionStatuses.value[questionId] = 'submitted';
    try {
      console.log(`[${new Date().toISOString()}] [courseFeatures.js] Submitting answer to: /api/student-courses/submit-answer`, submission);
      await retryOperation(() => api.post('/api/student-courses/submit-answer', submission));
      console.log(`[${new Date().toISOString()}] [courseFeatures.js] Answer submitted for question ${questionId}`);
      submittedAnswers.value.push({
        questionId,
        answer: selectedAnswers.value[questionId],
        timestamp: new Date().toISOString()
      });
      saveAnswersToCache();
      emit('show-message', 'Answer submitted successfully.');
      navigateNext();
    } catch (error) {
      console.error(`[${new Date().toISOString()}] [courseFeatures.js] Submission error for question ${questionId}:`, error.response?.status, error.response?.data || error.message);
      let errorMessage = 'Failed to submit answer. It will be retried later.';
      if (error.response?.status === 404) {
        console.warn(`[${new Date().toISOString()}] [courseFeatures.js] Answer submission endpoint not found. Ensure backend has POST /api/student-courses/submit-answer route.`);
        errorMessage = 'Answer submission failed due to missing endpoint. Answer cached for retry.';
      } else if (error.response?.data?.error) {
        errorMessage = `Failed to submit answer: ${error.response.data.error}`;
      }
      emit('show-message', errorMessage);
      pendingSubmissions.value.push(submission);
      submittedAnswers.value.push({
        questionId,
        answer: selectedAnswers.value[questionId],
        timestamp: new Date().toISOString()
      });
      saveAnswersToCache();
      await retryPendingSubmissions();
      navigateNext();
    }
  }

  async function submitExam(isAutoSubmit = false) {
    console.log(`[${new Date().toISOString()}] [courseFeatures.js] Submitting exam, isAutoSubmit:`, isAutoSubmit);
    if (timerInterval.value) clearInterval(timerInterval.value);
    await retryPendingSubmissions();
    const allQuestions = [...questions.value.phase1, ...questions.value.phase2];
    const answers = allQuestions.map(question => ({
      questionId: question.id,
      selectedAnswer: selectedAnswers.value[question.id] || null,
      status: questionStatuses.value[question.id] || 'default',
      startTime: examStartedAt.value,
    }));
    const submissionData = {
      studentId: studentId.value,
      courseId: selectedCourse.value?.id,
      answers,
      isMalpractice: hasMalpractice.value,
    };
    if (!submissionData.studentId || !submissionData.courseId || !submissionData.answers.length) {
      console.error(`[${new Date().toISOString()}] [courseFeatures.js] Invalid exam submission data:`, submissionData);
      emit('show-message', 'Invalid exam data. Please try again.');
      return;
    }
    try {
      console.log(`[${new Date().toISOString()}] [courseFeatures.js] Sending exam submission to server:`, submissionData);
      const response = await retryOperation(() => api.post('/api/student-courses/submit-exam', submissionData));
      console.log(`[${new Date().toISOString()}] [courseFeatures.js] Exam submission response:`, response.data);
      examResults.value = response.data.results || { marks: [], totalMarks: 0 };
      showResultsView.value = true;
      const courseIndex = props.courses.findIndex(c => c.id === selectedCourse.value?.id);
      if (courseIndex !== -1) {
        props.courses[courseIndex] = {
          ...props.courses[courseIndex],
          hasCompleted: !isAutoSubmit && !hasMalpractice.value,
          hasMalpractice: hasMalpractice.value,
          hasExited: isAutoSubmit && examStatus.value[selectedCourse.value?.id] === 'You Have Exited from Exam',
        };
        if (!isAutoSubmit && !hasMalpractice.value) {
          examStatus.value[selectedCourse.value?.id] = 'Exam completed successfully';
        } else if (hasMalpractice.value) {
          examStatus.value[selectedCourse.value?.id] = 'Your Exam Auto Evaluated';
        } else if (isAutoSubmit && examStatus.value[selectedCourse.value?.id] === 'You Have Exited from Exam') {
          examStatus.value[selectedCourse.value?.id] = 'You Have Exited from Exam';
        } else if (isAutoSubmit && examStatus.value[selectedCourse.value?.id] === 'Exam Elapsed') {
          examStatus.value[selectedCourse.value?.id] = 'Exam Elapsed';
        }
      }
      showMalpracticeWarning.value = false;
      let message;
      if (hasMalpractice.value) {
        message = 'Your Exam Auto Evaluated Due to Malpractice';
      } else if (isAutoSubmit && examStatus.value[selectedCourse.value?.id] === 'You Have Exited from Exam') {
        message = 'You Have Exited from Exam';
      } else if (isAutoSubmit && examStatus.value[selectedCourse.value?.id] === 'Exam Elapsed') {
        message = 'Exam Time Elapsed';
      } else {
        message = 'Exam Completed Successfully';
      }
      emit('show-message', message);
      isExamStarted.value = false;
      isExamPaused.value = false;
      await exitFullScreen();
      removeMalpracticePrevention();
      clearCache();
    } catch (error) {
      console.error(`[${new Date().toISOString()}] [courseFeatures.js] Error submitting exam:`, error.response?.data || error.message);
      emit('show-message', `Failed to submit exam: ${error.response?.data?.error || error.message}. Your answers are cached and will be retried.`);
      pendingSubmissions.value.push(submissionData);
      saveAnswersToCache();
      isExamStarted.value = false;
      isExamPaused.value = false;
      await exitFullScreen();
      removeMalpracticePrevention();
    }
  }

  async function logMalpractice(type) {
    if (!selectedCourse.value) return;
    try {
      await api.post('/api/student-courses/malpractice', {
        studentId: studentId.value,
        courseId: selectedCourse.value.id,
        type,
      });
      console.log(`[${new Date().toISOString()}] [courseFeatures.js] Malpractice logged: ${type}`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] [courseFeatures.js] Error logging malpractice:`, error.response?.data || error.message);
    }
  }

  function handleImageError(field, question = null) {
    if (field === 'studentPhoto') {
      console.error(`[${new Date().toISOString()}] [courseFeatures.js] Failed to load student photo`);
      emit('show-message', 'Failed to load student photo. Proceeding without photo.');
    } else {
      console.error(`[${new Date().toISOString()}] [courseFeatures.js] Failed to load image for ${field}:`, question[field]);
      question[field] = null;
    }
  }

  let malpracticeEventHandlers = null;

  function setupMalpracticePrevention() {
    const preventRightClick = (e) => {
      e.preventDefault();
      logMalpractice('right_click');
      handleMalpractice('right_click');
    };
    document.addEventListener('contextmenu', preventRightClick);

    const detectScreenshot = (e) => {
      const isScreenshotKey =
        e.code === 'PrintScreen' ||
        (e.metaKey && e.shiftKey && e.code === 'KeyS') ||
        (e.ctrlKey && e.altKey && e.code === 'KeyS') ||
        (e.altKey && e.code === 'PrintScreen') ||
        (e.metaKey && e.code === 'KeyS') ||
        (e.ctrlKey && e.shiftKey && e.code === 'KeyS');
      if (isScreenshotKey) {
        e.preventDefault();
        logMalpractice('screenshot_key');
        handleMalpractice('screenshot_key');
      }
    };
    document.addEventListener('keydown', detectScreenshot);

    const detectCriticalActions = async (e) => {
      if (e.code === 'Escape' || e.code === 'F11') {
        e.preventDefault();
        console.log(`[${new Date().toISOString()}] [courseFeatures.js] Detected Esc or F11 key press, logging as critical action`);
        await logMalpractice('critical_action');
        handleMalpractice('other');
      }
    };
    document.addEventListener('keydown', detectCriticalActions);

    const detectClipboardImage = async (e) => {
      try {
        const items = (e.clipboardData || window.clipboardData).items;
        for (const item of items) {
          if (item.type.includes('image')) {
            logMalpractice('screenshot_clipboard');
            handleMalpractice('other');
          }
        }
      } catch (error) {
        console.error(`[${new Date().toISOString()}] [courseFeatures.js] Error checking clipboard:`, error);
      }
    };
    document.addEventListener('paste', detectClipboardImage);

    const detectFocusLoss = debounce(() => {
      if (document.visibilityState === 'hidden') {
        logMalpractice('tab_switch');
        handleMalpractice('other');
      }
    }, 1000);
    document.addEventListener('visibilitychange', detectFocusLoss);

    const detectWindowBlur = debounce(() => {
      logMalpractice('window_blur');
      handleMalpractice('other');
    }, 1000);
    window.addEventListener('blur', detectWindowBlur);

    const detectFullScreenExit = () => {
      if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.mozFullScreenElement && !document.msFullscreenElement && isExamStarted.value) {
        logMalpractice('fullscreen_exit');
        handleMalpractice('other');
      }
    };
    document.addEventListener('fullscreenchange', detectFullScreenExit);
    document.addEventListener('webkitfullscreenchange', detectFullScreenExit);
    document.addEventListener('mozfullscreenchange', detectFullScreenExit);
    document.addEventListener('MSFullscreenChange', detectFullScreenExit);

    malpracticeEventHandlers = {
      contextmenu: preventRightClick,
      keydown_screenshot: detectScreenshot,
      keydown_critical: detectCriticalActions,
      paste: detectClipboardImage,
      visibilitychange: detectFocusLoss,
      blur: detectWindowBlur,
      fullscreenchange: detectFullScreenExit,
      webkitfullscreenchange: detectFullScreenExit,
      mozfullscreenchange: detectFullScreenExit,
      MSFullscreenChange: detectFullScreenExit,
    };
  }

  function removeMalpracticePrevention() {
    if (malpracticeEventHandlers) {
      document.removeEventListener('contextmenu', malpracticeEventHandlers.contextmenu);
      document.removeEventListener('keydown', malpracticeEventHandlers.keydown_screenshot);
      document.removeEventListener('keydown', malpracticeEventHandlers.keydown_critical);
      document.removeEventListener('paste', malpracticeEventHandlers.paste);
      document.removeEventListener('visibilitychange', malpracticeEventHandlers.visibilitychange);
      window.removeEventListener('blur', malpracticeEventHandlers.blur);
      document.removeEventListener('fullscreenchange', malpracticeEventHandlers.fullscreenchange);
      document.removeEventListener('webkitfullscreenchange', malpracticeEventHandlers.webkitfullscreenchange);
      document.removeEventListener('mozfullscreenchange', malpracticeEventHandlers.mozfullscreenchange);
      document.removeEventListener('MSFullscreenChange', malpracticeEventHandlers.MSFullscreenChange);
      malpracticeEventHandlers = null;
    }
  }

  async function handleMalpractice(type) {
    malpracticeAttempts.value[type] = (malpracticeAttempts.value[type] || 0) + 1;
    const totalAttempts = Object.values(malpracticeAttempts.value).reduce((sum, count) => sum + count, 0);
    console.log(`[${new Date().toISOString()}] [courseFeatures.js] Malpractice attempt (${type}):`, malpracticeAttempts.value[type], 'Total attempts:', totalAttempts);

    if (malpracticeAttempts.value[type] === 1 || malpracticeAttempts.value[type] === 2) {
      showMalpracticeWarning.value = true;
      console.log(`[${new Date().toISOString()}] [courseFeatures.js] Warning: Suspicious ${type.replace('_', ' ')} detected (${malpracticeAttempts.value[type]}/2). Further attempts will lead to auto-evaluation.`);
    } else if (totalAttempts >= 3) {
      hasMalpractice.value = true;
      examStatus.value[selectedCourse.value?.id] = 'Your Exam Auto Evaluated';
      console.log(`[${new Date().toISOString()}] [courseFeatures.js] Your Exam Auto Evaluated Due to Malpractice`);

      const allQuestions = [...questions.value.phase1, ...questions.value.phase2];
      const answersToSubmit = allQuestions.map(question => ({
        questionId: question.id,
        selectedAnswer: selectedAnswers.value[question.id] || null,
        status: questionStatuses.value[question.id] || 'default',
        startTime: examStartedAt.value,
      }));
      console.log(`[${new Date().toISOString()}] [courseFeatures.js] Submitting answers for auto-evaluation due to malpractice:`, answersToSubmit);

      const courseIndex = props.courses.findIndex(c => c.id === selectedCourse.value?.id);
      if (courseIndex !== -1) {
        props.courses[courseIndex] = {
          ...props.courses[courseIndex],
          hasMalpractice: true,
        };
      }

      await submitExam(true);
      saveAnswersToCache();
      goBackToCourses();
    }
  }

  function dismissMalpracticeWarning() {
    try {
      console.log(`[${new Date().toISOString()}] [courseFeatures.js] Dismiss malpractice warning button clicked`);
      console.log(`[${new Date().toISOString()}] [courseFeatures.js] Current state before dismissal:`, {
        showMalpracticeWarning: showMalpracticeWarning.value,
        isExamPaused: isExamPaused.value,
        isExamStarted: isExamStarted.value,
      });
      showMalpracticeWarning.value = false;
      isExamPaused.value = false;
      console.log(`[${new Date().toISOString()}] [courseFeatures.js] Malpractice warning dismissed`);
      console.log(`[${new Date().toISOString()}] [courseFeatures.js] State after dismissal:`, {
        showMalpracticeWarning: showMalpracticeWarning.value,
        isExamPaused: isExamPaused.value,
      });
      if (isExamStarted.value) {
        startTimer();
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] [courseFeatures.js] Error dismissing malpractice warning:`, error);
      emit('show-message', 'Failed to dismiss warning. Please try again.');
    }
  }

  async function typesetMathJax() {
    if (mathJaxFailed.value || !mathJaxLoaded.value) return;
    if (window.MathJax && window.MathJax.typesetPromise) {
      try {
        const elements = document.querySelectorAll('.mathjax-content');
        if (elements.length > 0) {
          await window.MathJax.typesetPromise([...elements]);
          console.log(`[${new Date().toISOString()}] [courseFeatures.js] MathJax typesetting completed successfully`);
        }
      } catch (error) {
        console.error(`[${new Date().toISOString()}] [courseFeatures.js] MathJax typesetting error:`, error);
        mathJaxFailed.value = true;
        emit('show-message', 'Failed to render formulas. Displaying raw text.');
      }
    }
  }

  function loadMathJax(attempt = 1, maxAttempts = 3) {
    if (window.MathJax) {
      mathJaxLoaded.value = true;
      nextTick(() => debouncedTypesetMathJax());
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
    script.async = true;
    script.onload = () => {
      mathJaxLoaded.value = true;
      console.log(`[${new Date().toISOString()}] [courseFeatures.js] MathJax loaded successfully`);
      window.MathJax = {
        tex: {
          inlineMath: [['\\(', '\\)']],
          displayMath: [['\\[', '\\]']],
          tags: 'ams',
        },
        options: {
          skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
          ignoreHtmlClass: 'mathjax-ignore',
        },
      };
      nextTick(() => debouncedTypesetMathJax());
    };
    script.onerror = () => {
      console.error(`[${new Date().toISOString()}] [courseFeatures.js] Failed to load MathJax (attempt ${attempt})`);
      if (attempt < maxAttempts) {
        console.log(`[${new Date().toISOString()}] [courseFeatures.js] Retrying MathJax load (attempt ${attempt + 1})`);
        setTimeout(() => loadMathJax(attempt + 1, maxAttempts), 1000);
      } else {
        mathJaxFailed.value = true;
        emit('show-message', 'Failed to load MathJax. Formulas will be displayed as raw text.');
      }
    };
    document.head.appendChild(script);
  }

  function setupMutationObserver() {
    const targetNode = document.querySelector('.space-y-6');
    if (!targetNode) return;
    const config = { childList: true, subtree: true };
    const callback = (mutationsList) => {
      for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
          const hasMathJaxContent = Array.from(mutation.addedNodes).some(
            node => node.nodeType === 1 && node.querySelector('.mathjax-content')
          );
          if (hasMathJaxContent) {
            nextTick(() => debouncedTypesetMathJax());
          }
        }
      }
    };
    mutationObserver.value = new MutationObserver(callback);
    mutationObserver.value.observe(targetNode, config);
  }

  function clearSessionData() {
    goBackToCourses();
    selectedCourse.value = null;
    questions.value = { phase1: [], phase2: [] };
    selectedAnswers.value = {};
    questionStatuses.value = {};
    examResults.value = null;
    showResultsView.value = false;
    clearCache();
  }

  onMounted(() => {
    if (!studentId.value) {
      console.error(`[${new Date().toISOString()}] [courseFeatures.js] No student ID available`);
      emit('show-message', 'Please log in to access your courses.');
      return;
    }
    console.log(`[${new Date().toISOString()}] [courseFeatures.js] Student ID in Courses.vue:`, studentId.value);
    console.log(`[${new Date().toISOString()}] [courseFeatures.js] Initial courses prop:`, props.courses);
    initializeBaseUrl();
    loadMathJax();
    nextTick(() => {
      setupMutationObserver();
      // Rely on Dashboard.vue to fetch courses initially
      // fetchCourses(); // Commented out to avoid duplicate fetch
    });
  });

  onUpdated(() => {
    if (mathJaxLoaded.value && !mathJaxFailed.value) {
      nextTick(() => debouncedTypesetMathJax());
    }
  });

  onBeforeUnmount(() => {
    if (timerInterval.value) clearInterval(timerInterval.value);
    if (mutationObserver.value) {
      mutationObserver.value.disconnect();
    }
    removeMalpracticePrevention();
    clearSessionData();
    exitFullScreen();
  });

  return {
    selectedCourse,
    questions,
    isQuestionsLoading,
    questionsLoaded,
    questionsError,
    mathJaxLoaded,
    mathJaxFailed,
    mutationObserver,
    debouncedTypesetMathJax,
    selectedAnswers,
    questionStatuses,
    currentPhase,
    currentQuestionIndex,
    remainingTime,
    timerInterval,
    examStartedAt,
    showExitModalFlag,
    isExamStarted,
    showMalpracticeWarning,
    malpracticeAttempts,
    hasMalpractice,
    isDownloading,
    isRestricted,
    isHallTicketRestricted,
    baseUrl,
    examResults,
    showResultsView,
    examStatus,
    pendingSubmissions,
    submittedAnswers,
    isExamPaused,
    fetchCourses,
    attemptStartExam,
    goBackToCourses,
    showExitModal,
    confirmExit,
    selectQuestion,
    navigatePrevious,
    navigateNext,
    getCircleClass,
    selectOption,
    markForReview,
    submitAnswer,
    submitExam,
    dismissMalpracticeWarning,
    handleImageError,
    formatTime
  };
}
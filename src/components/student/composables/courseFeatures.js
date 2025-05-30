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
  const baseUrl = ref('');
  const studentPhoto = ref(null);
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
      console.log('Answers saved to cache:', cacheData);
    } catch (error) {
      console.error('Error saving to cache:', error);
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
        console.log('Answers restored from cache:', { selectedAnswers: selectedAnswers.value, questionStatuses: questionStatuses.value });
        retryPendingSubmissions();
      } catch (error) {
        console.error('Error restoring cache:', error);
        clearCache();
      }
    }
  }

  function clearCache() {
    if (!selectedCourse.value || !studentId.value) return;
    const cacheKey = `exam_${studentId.value}_${selectedCourse.value.id}`;
    localStorage.removeItem(cacheKey);
    console.log('Cache cleared for:', cacheKey);
    pendingSubmissions.value = [];
    submittedAnswers.value = [];
  }

  async function retryPendingSubmissions() {
    if (pendingSubmissions.value.length === 0) return;
    const submissions = [...pendingSubmissions.value];
    pendingSubmissions.value = [];
    for (const submission of submissions) {
      try {
        if (!submission.studentId || !submission.courseId || !submission.questionId || !submission.selectedAnswer) {
          console.error('Invalid pending submission:', submission);
          continue;
        }
        await retryOperation(() => api.post('/api/student-courses/submit-answer', submission));
        console.log(`Pending answer submitted for question ${submission.questionId}`);
        submittedAnswers.value.push({
          questionId: submission.questionId,
          answer: submission.selectedAnswer,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error(`Failed to retry submission for question ${submission.questionId}:`, error.response?.data || error.message);
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
      console.log('Courses prop updated:', newVal);
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
      console.log('[Frontend] Base URL set to:', baseURL);
    } catch (error) {
      console.error('[Frontend] Failed to fetch base URL:', error);
      api.defaults.baseURL = process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000';
      baseUrl.value = api.defaults.baseURL;
      console.log('[Frontend] Using fallback base URL:', api.defaults.baseURL);
    }
  }

  async function fetchStudentPhoto() {
    if (!props.user?.registerNo) {
      console.log('No register number available for photo fetch');
      studentPhoto.value = null;
      return;
    }
    try {
      const url = `/api/student-profile/profile/${props.user.registerNo}`;
      console.log('Fetching student profile from:', `${baseUrl.value}${url}`);
      const response = await api.get(url);
      const data = response.data;
      if (data.photo) {
        studentPhoto.value = `${baseUrl.value}${data.photo}`;
        console.log('Student photo URL set:', studentPhoto.value);
      } else {
        console.log('No photo found in profile');
        studentPhoto.value = null;
      }
    } catch (error) {
      console.error('Error fetching student photo:', error);
      emit('show-message', 'Failed to load student photo.');
    }
  }

  function isEligible(course) {
    if (!course?.isEligible) {
      emit('show-message', 'You are not eligible to take this exam.');
      return false;
    }
    return true;
  }

  function isPaymentConfirmed(course) {
    if (!course?.paymentConfirmed) {
      emit('show-message', 'Payment not confirmed for this exam.');
      return false;
    }
    return true;
  }

  async function isWithinTimeWindow(course) {
    if (!course?.examDate || !course?.examTime) return false;
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

    if (!isSameDate || isBeforeStart) {
      examStatus.value[course.id] = 'Exam Not Yet Started';
      return false;
    } else if (isAfterEnd) {
      examStatus.value[course.id] = 'Exam Elapsed';
      return false;
    } else if (isWithinTime) {
      return true;
    }
    return false;
  }

  async function fetchISTTime() {
    try {
      const response = await axios.get('http://worldtimeapi.org/api/timezone/Asia/Kolkata');
      return moment(response.data.datetime).tz('Asia/Kolkata');
    } catch (error) {
      console.error('Failed to fetch IST time:', error.message);
      console.warn('Using local machine IST time as fallback');
      return moment.tz('Asia/Kolkata');
    }
  }

  function updateExamStatus() {
    props.courses.forEach(async (course) => {
      if (course.hasCompleted && !course.hasMalpractice) {
        examStatus.value[course.id] = 'Exam completed successfully';
      } else if (course.hasMalpractice) {
        examStatus.value[course.id] = 'Your Exam Auto Evaluated';
      } else if (course.hasExited) {
        examStatus.value[course.id] = 'You Have Exited from Exam';
      } else {
        await isWithinTimeWindow(course);
      }
    });
  }

  async function attemptStartExam(course) {
    if (!course) return;
    if (course.hasCompleted || course.hasMalpractice || course.hasExited) {
      emit('show-message', examStatus.value[course.id] || 'Exam not available.');
      return;
    }
    if (!isEligible(course) || !isPaymentConfirmed(course) || !(await isWithinTimeWindow(course))) {
      emit('show-message', examStatus.value[course.id] || 'Exam not available.');
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
      console.log('Entered full-screen mode');
    } catch (error) {
      console.error('Failed to enter full-screen mode:', error);
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
        console.log('Exited full-screen mode');
      }
    } catch (error) {
      console.error('Failed to exit full-screen mode:', error);
    }
  }

  async function startExam(course) {
    selectedCourse.value = course;
    console.log('Starting exam for course:', course);
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
    malpracticeAttempts.value = { right_click: 0, screenshot_key: 0, other: 0 }; // Reset malpractice attempts
    hasMalpractice.value = false;
    showMalpracticeWarning.value = false;
    pendingSubmissions.value = [];
    submittedAnswers.value = [];
    isExamPaused.value = false;

    await fetchStudentPhoto();
    startTimer();

    try {
      const baseURL = await apiConfig.getBaseURL();
      const url = `${baseURL}/api/student-courses/questions/${course.id}`;
      const response = await retryOperation(() => api.get(url));
      questions.value = {
        phase1: response.data.phase1 || [],
        phase2: response.data.phase2 || [],
      };
      console.log('Loaded questions:', questions.value);

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
      console.error('Error fetching questions:', error.response?.data || error.message);
      questionsError.value = `Failed to fetch questions: ${error.response?.data?.message || error.message}`;
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
    malpracticeAttempts.value = { right_click: 0, screenshot_key: 0, other: 0 }; // Reset malpractice attempts
    showMalpracticeWarning.value = false;
    hasMalpractice.value = false;
    isRestricted.value = false;
    studentPhoto.value = null;
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
    console.log('Selected answers:', selectedAnswers.value);
    saveAnswersToCache();
  }

  function markForReview(questionId) {
    if (questionStatuses.value[questionId] === 'submitted' || isExamPaused.value) return;
    questionStatuses.value[questionId] = 'review';
    console.log('Question statuses:', questionStatuses.value);
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
      console.error('Invalid submission data:', submission);
      emit('show-message', 'Invalid submission data. Please try again.');
      return;
    }
    questionStatuses.value[questionId] = 'submitted';
    try {
      await retryOperation(() => api.post('/api/student-courses/submit-answer', submission));
      console.log(`Answer submitted for question ${questionId}`);
      submittedAnswers.value.push({
        questionId,
        answer: selectedAnswers.value[questionId],
        timestamp: new Date().toISOString()
      });
      saveAnswersToCache();
      emit('show-message', 'Answer submitted successfully.');
      navigateNext();
    } catch (error) {
      console.error('Submission error:', error.response?.data || error.message);
      emit('show-message', `Failed to submit answer: ${error.response?.data?.message || error.message}`);
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
    console.log('Submitting exam, isAutoSubmit:', isAutoSubmit);
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
      console.error('Invalid exam submission data:', submissionData);
      emit('show-message', 'Invalid exam data. Please try again.');
      return;
    }
    try {
      console.log('Sending exam submission to server:', submissionData);
      const response = await retryOperation(() => api.post('/api/student-courses/submit-exam', submissionData));
      console.log('Exam submission response:', response.data);
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
        // Update examStatus explicitly
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
      console.error('Error submitting exam:', error.response?.data || error.message);
      emit('show-message', `Failed to submit exam: ${error.response?.data?.message || error.message}. Your answers are cached and will be retried.`);
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
      console.log(`Malpractice logged: ${type}`);
    } catch (error) {
      console.error('Error logging malpractice:', error.response?.data || error.message);
    }
  }

  function handleImageError(field, question = null) {
    if (field === 'studentPhoto') {
      console.error('Failed to load student photo');
      studentPhoto.value = null;
    } else {
      console.error(`Failed to load image for ${field}:`, question[field]);
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
        e.key === 'PrintScreen' ||
        (e.metaKey && e.shiftKey && e.key === 'S') ||
        (e.ctrlKey && e.altKey && e.key === 'S') ||
        (e.altKey && e.key === 'PrintScreen') ||
        (e.metaKey && e.key === 'S') ||
        (e.ctrlKey && e.shiftKey && e.key === 'S');
      if (isScreenshotKey) {
        e.preventDefault();
        logMalpractice('screenshot_key');
        handleMalpractice('screenshot_key');
      }
    };
    document.addEventListener('keydown', detectScreenshot);

    const detectCriticalActions = async (e) => {
      if (e.key === 'Escape' || e.key === 'F11') {
        e.preventDefault();
        console.log('Detected Esc or F11 key press, logging as critical action');
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
        console.error('Error checking clipboard:', error);
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

  function handleMalpractice(type) {
    malpracticeAttempts.value[type] = (malpracticeAttempts.value[type] || 0) + 1;
    const totalAttempts = Object.values(malpracticeAttempts.value).reduce((sum, count) => sum + count, 0);
    console.log(`Malpractice attempt (${type}):`, malpracticeAttempts.value[type], 'Total attempts:', totalAttempts);

    if (malpracticeAttempts.value[type] === 1 || malpracticeAttempts.value[type] === 2) {
      showMalpracticeWarning.value = true;
      console.log(`Warning: Suspicious ${type.replace('_', ' ')} detected (${malpracticeAttempts.value[type]}/2). Further attempts will lead to auto-evaluation.`);
    } else if (totalAttempts >= 3) {
      hasMalpractice.value = true;
      examStatus.value[selectedCourse.value?.id] = 'Your Exam Auto Evaluated';
      console.log('Your Exam Auto Evaluated Due to Malpractice');

      // Log the answers being sent to the backend for auto-evaluation
      const allQuestions = [...questions.value.phase1, ...questions.value.phase2];
      const answersToSubmit = allQuestions.map(question => ({
        questionId: question.id,
        selectedAnswer: selectedAnswers.value[question.id] || null,
        status: questionStatuses.value[question.id] || 'default',
        startTime: examStartedAt.value,
      }));
      console.log('Submitting answers for auto-evaluation due to malpractice:', answersToSubmit);

      submitExam(true);
      goBackToCourses();
    }
  }

  function dismissMalpracticeWarning() {
    try {
      console.log('Dismiss malpractice warning button clicked at', new Date().toISOString());
      console.log('Current state before dismissal:', {
        showMalpracticeWarning: showMalpracticeWarning.value,
        isExamPaused: isExamPaused.value,
        isExamStarted: isExamStarted.value,
      });
      showMalpracticeWarning.value = false;
      isExamPaused.value = false;
      console.log('Malpractice warning dismissed');
      console.log('State after dismissal:', {
        showMalpracticeWarning: showMalpracticeWarning.value,
        isExamPaused: isExamPaused.value,
      });
      if (isExamStarted.value) {
        startTimer();
      }
    } catch (error) {
      console.error('Error dismissing malpractice warning:', error);
      console.log('Failed to dismiss warning. Please try again.');
    }
  }

  async function typesetMathJax() {
    if (mathJaxFailed.value || !mathJaxLoaded.value) return;
    if (window.MathJax && window.MathJax.typesetPromise) {
      try {
        const elements = document.querySelectorAll('.mathjax-content');
        if (elements.length > 0) {
          await window.MathJax.typesetPromise([...elements]);
          console.log('MathJax typesetting completed successfully');
        }
      } catch (error) {
        console.error('MathJax typesetting error:', error);
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
      console.log('MathJax loaded successfully');
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
      console.error(`Failed to load MathJax (attempt ${attempt})`);
      if (attempt < maxAttempts) {
        console.log(`Retrying MathJax load (attempt ${attempt + 1})`);
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
    studentPhoto.value = null;
    examResults.value = null;
    showResultsView.value = false;
    clearCache();
  }

  onMounted(() => {
    if (!studentId.value) {
      console.error('No student ID available');
      emit('show-message', 'Please log in to access your courses.');
      return;
    }
    console.log('Student ID in Courses.vue:', studentId.value);
    console.log('Initial courses prop:', props.courses);
    initializeBaseUrl();
    loadMathJax();
    nextTick(() => {
      setupMutationObserver();
      updateExamStatus();
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
    baseUrl,
    studentPhoto,
    examResults,
    showResultsView,
    canSubmit,
    currentQuestion,
    currentQuestionIndexInAll,
    studentId,
    examStatus,
    isExamPaused,
    attemptStartExam,
    startExam,
    startTimer,
    formatTime,
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
    logMalpractice,
    handleImageError,
    setupMalpracticePrevention,
    removeMalpracticePrevention,
    handleMalpractice,
    dismissMalpracticeWarning,
    typesetMathJax,
    loadMathJax,
    setupMutationObserver,
    downloadHallTicketForStudent,
    clearSessionData,
  };
}
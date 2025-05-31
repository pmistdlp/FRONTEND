import { ref } from 'vue';
import axios from 'axios';
import apiConfig from '@/config/apiConfig';

export function useExam() {
  const isExamActive = ref(false);
  const questions = ref([]);
  const currentQuestionIndex = ref(0);
  const selectedAnswers = ref({});
  const isLoading = ref(false);
  const errorMessage = ref('');
  const examWindow = ref(null);

  // Start Exam
  const startExam = async (courseId, studentId) => {
    isLoading.value = true;
    errorMessage.value = '';
    try {
      const baseURL = await apiConfig.getBaseURL();
      console.log(`[${new Date().toISOString()}] [Exam.js] Starting exam for courseId: ${courseId}, studentId: ${studentId}`);
      const response = await axios.post(
        `${baseURL}/api/student-exams/start/${courseId}`,
        {},
        { withCredentials: true }
      );

      if (response.data.questions) {
        questions.value = response.data.questions;
        isExamActive.value = true;
        currentQuestionIndex.value = 0;
        selectedAnswers.value = {};
        openExamPortal();
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] [Exam.js] Error starting exam:`, error.response?.data || error.message);
      errorMessage.value = error.response?.data?.error || 'Failed to start exam';
    } finally {
      isLoading.value = false;
    }
  };

  // Open Exam Portal in a New Window
  const openExamPortal = () => {
    if (examWindow.value && !examWindow.value.closed) {
      examWindow.value.focus();
      return;
    }

    const examPortalHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Exam Portal</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          body { font-family: 'Poppins', sans-serif; }
          .option:hover { background-color: #e0f2fe; }
          .selected { background-color: #bae6fd; }
        </style>
      </head>
      <body class="bg-gray-100 p-4">
        <div id="exam-app" class="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-lg"></div>
        <script>
          const questions = ${JSON.stringify(questions.value)};
          const selectedAnswers = {};
          let currentQuestionIndex = 0;

          function renderExam() {
            const app = document.getElementById('exam-app');
            const question = questions[currentQuestionIndex];
            if (!question) {
              app.innerHTML = '<h2 class="text-2xl font-bold text-indigo-600">No questions available</h2>';
              return;
            }

            app.innerHTML = \`
              <div class="space-y-4">
                <h2 class="text-xl font-semibold text-indigo-600">Question \${currentQuestionIndex + 1} of \${questions.length}</h2>
                <p class="text-gray-800">\${question.question}</p>
                \${question.questionImage ? '<img src="' + question.questionImage + '" class="max-w-full h-auto" />' : ''}
                <div class="space-y-2">
                  \${['option1', 'option2', 'option3', 'option4'].map((opt, index) => \`
                    <div class="option p-2 border rounded cursor-pointer \${selectedAnswers[question.id] === opt ? 'selected' : ''}"
                         onclick="selectAnswer('\${question.id}', '\${opt}')">
                      \${question[opt]} \${question[opt + 'Image'] ? '<img src="' + question[opt + 'Image'] + '" class="max-w-xs h-auto" />' : ''}
                    </div>
                  \`).join('')}
                </div>
                <div class="flex justify-between mt-4">
                  <button \${currentQuestionIndex === 0 ? 'disabled' : ''} 
                          class="px-4 py-2 bg-gray-300 rounded \${currentQuestionIndex === 0 ? 'cursor-not-allowed' : 'hover:bg-gray-400'}" 
                          onclick="navigateQuestion(-1)">Previous</button>
                  <button \${currentQuestionIndex === questions.length - 1 ? 'disabled' : ''} 
                          class="px-4 py-2 bg-indigo-500 text-white rounded \${currentQuestionIndex === questions.length - 1 ? 'cursor-not-allowed' : 'hover:bg-indigo-600'}" 
                          onclick="navigateQuestion(1)">Next</button>
                </div>
                <button class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600" 
                        onclick="submitExam()">Submit Exam</button>
              </div>
            \`;
          }

          function selectAnswer(questionId, option) {
            selectedAnswers[questionId] = option;
            window.opener.postMessage({ type: 'selectAnswer', questionId, option, courseId: questions[0].courseId }, '*');
            renderExam();
          }

          function navigateQuestion(direction) {
            currentQuestionIndex += direction;
            renderExam();
          }

          function submitExam() {
            if (confirm('Are you sure you want to submit the exam?')) {
              window.opener.postMessage({ type: 'submitExam', courseId: questions[0].courseId }, '*');
              window.close();
            }
          }

          window.addEventListener('load', renderExam);
        </script>
      </body>
      </html>
    `;

    const blob = new Blob([examPortalHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    examWindow.value = window.open(url, '_blank', 'width=800,height=600');
    
    if (!examWindow.value) {
      errorMessage.value = 'Please allow popups to open the exam portal';
    }
  };

  // Submit Answer
  const submitAnswer = async (courseId, questionId, selectedAnswer) => {
    try {
      const baseURL = await apiConfig.getBaseURL();
      await axios.post(
        `${baseURL}/api/student-exams/submit-answer`,
        { courseId, questionId, selectedAnswer },
        { withCredentials: true }
      );
      selectedAnswers.value[questionId] = selectedAnswer;
    } catch (error) {
      console.error(`[${new Date().toISOString()}] [Exam.js] Error submitting answer:`, error.response?.data || error.message);
      errorMessage.value = error.response?.data?.error || 'Failed to submit answer';
    }
  };

  // End Exam
  const endExam = async (courseId) => {
    try {
      const baseURL = await apiConfig.getBaseURL();
      await axios.post(
        `${baseURL}/api/student-exams/end/${courseId}`,
        {},
        { withCredentials: true }
      );
      isExamActive.value = false;
      questions.value = [];
      selectedAnswers.value = {};
      currentQuestionIndex.value = 0;
      if (examWindow.value && !examWindow.value.closed) {
        examWindow.value.close();
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] [Exam.js] Error ending exam:`, error.response?.data || error.message);
      errorMessage.value = error.response?.data?.error || 'Failed to end exam';
    }
  };

  // Handle Messages from Exam Window
  window.addEventListener('message', async (event) => {
    if (event.data.type === 'selectAnswer') {
      await submitAnswer(event.data.courseId, event.data.questionId, event.data.option);
    } else if (event.data.type === 'submitExam') {
      await endExam(event.data.courseId);
    }
  });

  return {
    isExamActive,
    questions,
    currentQuestionIndex,
    selectedAnswers,
    isLoading,
    errorMessage,
    startExam,
    submitAnswer,
    endExam,
  };
}
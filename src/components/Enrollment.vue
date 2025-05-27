<template>
  <div class="h-screen bg-gradient-to-br from-white to-gray-100 flex flex-col overflow-hidden">
    <!-- Header -->
    <header class="fixed top-0 left-0 right-0 z-10 py-2 px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between">
      <div class="flex items-center space-x-3">
        <img 
          src="@/images/pmist.png" 
          alt="PMIST Logo" 
          class="w-44 h-full pt-4 object-contain cursor-pointer" 
          @click="goToPMU" 
          v-no-right-click
        />
      </div>
      <p class="text-l font-semibold text-gray-600 text-center sm:text-right">
        Powered by Department of Informatics, PMIST
      </p>
    </header>

    <!-- Main Content -->
    <main class="flex-1 p-6 pt-16 sm:pt-20 overflow-y-auto">
      <div class="container mx-auto max-w-2xl">
        <h1 class="text-3xl font-bold text-gray-800 mb-6">Enroll in {{ course.name || 'Course' }}</h1>
        <div v-if="isLoading" class="text-center text-gray-600 flex items-center justify-center">
          <svg class="animate-spin h-5 w-5 mr-2 text-gray-600" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          Loading course details...
        </div>
        <div v-else-if="error" class="text-center text-red-600">{{ error }}</div>
        <div v-else>
          <!-- Step Cards -->
          <div class="bg-white p-6 rounded-lg shadow-lg mb-6">
            <!-- Step 1: Check Student -->
            <div v-if="step === 1" class="space-y-6">
              <h2 class="text-xl font-semibold text-gray-800 mb-4">Step 1: Verify Account</h2>
              <form @submit.prevent="checkStudent" class="space-y-4">
                <div>
                  <label class="block text-gray-700">Register Number</label>
                  <input 
                    v-model="form.registerNo" 
                    type="text" 
                    class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-400" 
                    required 
                    placeholder="Enter your register number"
                  />
                </div>
                <div>
                  <label class="block text-gray-700">Date of Birth (DDMMYYYY)</label>
                  <input 
                    v-model="form.dob" 
                    type="text" 
                    class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-400" 
                    required 
                    placeholder="e.g., 28022025"
                  />
                  <p v-if="dobError" class="text-red-500 text-sm">{{ dobError }}</p>
                </div>
                <button 
                  type="submit" 
                  class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors duration-300 flex items-center justify-center"
                  :disabled="isChecking"
                >
                  <svg v-if="isChecking" class="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  {{ isChecking ? 'Checking...' : 'Check Account' }}
                </button>
              </form>
            </div>

            <!-- Step 2: Additional Details -->
            <div v-if="step === 2" class="space-y-6">
              <h2 class="text-xl font-semibold text-gray-800 mb-4">Step 2: Complete Your Profile</h2>
              <form @submit.prevent="updateDetails" class="space-y-4">
                <div>
                  <label class="block text-gray-700">Full Name</label>
                  <input 
                    v-model="form.name" 
                    type="text" 
                    class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-400" 
                    required 
                    placeholder="Enter your full name"
                    @input="validateForm"
                  />
                </div>
                <div>
                  <label class="block text-gray-700">Aadhar Number (12 digits)</label>
                  <input 
                    v-model="form.aadharNumber" 
                    type="text" 
                    class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-400" 
                    required 
                    placeholder="Enter Aadhar number"
                    @input="validateForm"
                  />
                  <p v-if="aadharError" class="text-red-500 text-sm">{{ aadharError }}</p>
                </div>
                <div>
                  <label class="block text-gray-700">ABC ID (12 alphanumeric)</label>
                  <input 
                    v-model="form.abcId" 
                    type="text" 
                    class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-400" 
                    required 
                    placeholder="Enter ABC ID"
                    @input="validateForm"
                  />
                  <p v-if="abcIdError" class="text-red-500 text-sm">{{ abcIdError }}</p>
                </div>
                <div>
                  <label class="block text-gray-700">Profile Photo (Optional)</label>
                  <input 
                    type="file" 
                    ref="photoInput" 
                    @change="handlePhotoUpload" 
                    accept="image/*" 
                    class="w-full p-2 border rounded"
                  />
                  <div v-if="photoStatus" class="mt-2 p-4 bg-gray-50 rounded-lg shadow-inner">
                    <p class="text-sm font-semibold">{{ photoStatus.title }}</p>
                    <div v-if="photoStatus.progress < 100" class="w-full bg-gray-200 rounded h-2 mt-2">
                      <div class="bg-blue-600 h-2 rounded" :style="{ width: `${photoStatus.progress}%` }"></div>
                    </div>
                    <p class="text-sm text-gray-600 mt-1">{{ photoStatus.message }}</p>
                  </div>
                </div>
                <div>
                  <label class="block text-gray-700">e-Signature (Optional)</label>
                  <input 
                    type="file" 
                    ref="eSignatureInput" 
                    @change="handleESignatureUpload" 
                    accept="image/*" 
                    class="w-full p-2 border rounded"
                  />
                  <div v-if="eSignatureStatus" class="mt-2 p-4 bg-gray-50 rounded-lg shadow-inner">
                    <p class="text-sm font-semibold">{{ eSignatureStatus.title }}</p>
                    <div v-if="eSignatureStatus.progress < 100" class="w-full bg-gray-200 rounded h-2 mt-2">
                      <div class="bg-blue-600 h-2 rounded" :style="{ width: `${eSignatureStatus.progress}%` }"></div>
                    </div>
                    <p class="text-sm text-gray-600 mt-1">{{ eSignatureStatus.message }}</p>
                  </div>
                </div>
                <div class="flex space-x-4">
                  <button 
                    type="button" 
                    @click="step = 1" 
                    class="w-1/2 bg-gray-300 text-gray-800 py-2 rounded hover:bg-gray-400 transition-colors duration-300"
                  >
                    Back
                  </button>
                  <button 
                    type="submit" 
                    class="w-1/2 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors duration-300 flex items-center justify-center"
                    :disabled="isUpdating || !isFormValid"
                  >
                    <svg v-if="isUpdating" class="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    {{ isUpdating ? 'Updating...' : 'Update Profile' }}
                  </button>
                </div>
                <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>
              </form>
            </div>

            <!-- Step 3: Acknowledgment -->
            <div v-if="step === 3" class="space-y-6">
              <h2 class="text-xl font-semibold text-gray-800 mb-4">Step 3: Confirm Enrollment</h2>
              <p class="text-gray-600">
                Only the assignment scores are valid. You’ll be enrolled for the exam after completing the payment.
              </p>
              <p class="text-green-600">Course: {{ course.name }}</p>
              <p class="text-gray-600">Exam Date: {{ course.examDate || 'TBD' }} at {{ course.examTime || 'TBD' }} IST</p>
              <div class="flex space-x-4">
                <button 
                  type="button" 
                  @click="step = 2" 
                  class="w-1/2 bg-gray-300 text-gray-800 py-2 rounded hover:bg-gray-400 transition-colors duration-300"
                >
                  Back
                </button>
                <button 
                  @click="registerForExam" 
                  class="w-1/2 bg-green-600 text-white py-2 rounded hover:bg-green-700 transition-colors duration-300"
                  :disabled="isEnrolling"
                >
                  {{ isEnrolling ? 'Enrolling...' : 'Register for Exam' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="py-4 px-4 sm:px-6 lg:px-8 bg-gray-50 text-center text-gray-600 text-xs sm:text-sm shadow-inner">
      <p>Developed by <span class="font-semibold"><a href="https://salmanparis.tech/" target="_blank">Salman Paris</a></span> | © 2025 Department Of Informatics</p>
    </footer>

    <!-- Confirmation Popup -->
    <div v-if="showPopup" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">{{ popupTitle }}</h3>
        <p class="text-gray-600 mb-6">{{ popupMessage }}</p>
        <div class="flex space-x-4">
          <button 
            v-if="popupType === 'confirm'" 
            @click="handlePopupResponse(false)" 
            class="w-1/2 bg-gray-300 text-gray-800 py-2 rounded hover:bg-gray-400 transition-colors duration-300"
          >
            Cancel
          </button>
          <button 
            @click="handlePopupResponse(true)" 
            class="w-1/2 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors duration-300"
          >
            {{ popupType === 'confirm' ? 'Create Account' : 'OK' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  props: ['courseId'],
  data() {
    return {
      course: {},
      step: 1,
      isLoading: false,
      isChecking: false,
      isUpdating: false,
      isEnrolling: false,
      error: '',
      studentExists: false,
      form: {
        name: '',
        registerNo: '',
        dob: '',
        password: '',
        aadharNumber: '',
        abcId: '',
        photo: null,
        eSignature: null,
        studentId: null,
        source: 'public_enrollment',
      },
      dobError: '',
      aadharError: '',
      abcIdError: '',
      photoFile: null,
      eSignatureFile: null,
      photoStatus: null,
      eSignatureStatus: null,
      showPopup: false,
      popupTitle: '',
      popupMessage: '',
      popupType: 'info',
      popupResolve: null,
    };
  },
  computed: {
    isFormValid() {
      return this.form.name && this.form.aadharNumber && this.form.abcId && !this.aadharError && !this.abcIdError;
    },
  },
  methods: {
    async fetchCourse() {
      this.isLoading = true;
      try {
        const { data } = await axios.get(`/api/public-enrollment/${this.courseId}`);
        this.course = data;
      } catch (err) {
        this.error = 'Course not found or registration is closed';
        console.error('Fetch course error:', err);
      } finally {
        this.isLoading = false;
      }
    },
    async checkStudent() {
      this.isChecking = true;
      this.dobError = '';
      if (!/^\d{8}$/.test(this.form.dob)) {
        this.dobError = 'DOB must be in DDMMYYYY format (e.g., 28022025)';
        this.isChecking = false;
        return;
      }
      try {
        const { data } = await axios.get(`/api/public-enrollment/profile/${this.form.registerNo}`);
        if (data.dob !== this.form.dob) {
          this.showPopupMessage('Invalid DOB', 'The DOB does not match the registered account. Please check your details.');
        } else {
          this.studentExists = true;
          this.form = { ...this.form, ...data, password: data.dob, studentId: data.id };
          this.step = 2;
        }
      } catch (err) {
        if (err.response?.status === 404) {
          const confirmed = await this.showConfirmPopup(
            'Account Not Found',
            `No account exists for Register Number ${this.form.registerNo}. Would you like to create a new account?`
          );
          if (confirmed) {
            await this.createStudent();
          }
        } else {
          this.error = err.response?.data?.error || 'Error checking account';
          console.error('Check student error:', err);
        }
      } finally {
        this.isChecking = false;
      }
    },
    async createStudent() {
      try {
        const { data } = await axios.post('/api/public-enrollment/student', {
          name: this.form.name || `Student_${this.form.registerNo}`,
          registerNo: this.form.registerNo,
          dob: this.form.dob,
          password: this.form.dob,
          source: this.form.source,
        });
        this.studentExists = true;
        this.form.studentId = data.studentId;
        await this.showPopupMessage('Account Created', `Your account has been created! Default password is your DOB (${this.form.dob}). Proceed to complete your profile.`);
        this.step = 2;
      } catch (err) {
        this.error = err.response?.data?.error || 'Failed to create account';
        console.error('Create student error:', err);
      }
    },
    showPopupMessage(title, message) {
      this.popupTitle = title;
      this.popupMessage = message;
      this.popupType = 'info';
      this.showPopup = true;
      return new Promise((resolve) => {
        this.popupResolve = resolve;
      });
    },
    showConfirmPopup(title, message) {
      this.popupTitle = title;
      this.popupMessage = message;
      this.popupType = 'confirm';
      this.showPopup = true;
      return new Promise((resolve) => {
        this.popupResolve = resolve;
      });
    },
    handlePopupResponse(confirmed) {
      if (this.popupResolve) {
        this.popupResolve(confirmed);
        this.popupResolve = null;
      }
      this.showPopup = false;
    },
    validateAadhar() {
      this.aadharError = !this.form.aadharNumber || !/^\d{12}$/.test(this.form.aadharNumber)
        ? 'Aadhar Number must be 12 numeric digits'
        : '';
      this.validateForm(); // Trigger form validation
    },
    validateABCId() {
      this.abcIdError = !this.form.abcId || !/^[a-zA-Z0-9]{12}$/.test(this.form.abcId)
        ? 'ABC ID must be 12 alphanumeric characters'
        : '';
      this.validateForm(); // Trigger form validation
    },
    validateForm() {
      // This method ensures the button's disabled state is updated
      this.$forceUpdate(); // Force Vue to re-render the disabled state
    },
    handlePhotoUpload(event) {
      this.photoFile = event.target.files[0];
      if (this.photoFile) {
        this.photoStatus = { title: 'Uploading Photo', progress: 0, message: 'Starting upload...' };
        this.simulateUpload('photo');
      }
    },
    handleESignatureUpload(event) {
      this.eSignatureFile = event.target.files[0];
      if (this.eSignatureFile) {
        this.eSignatureStatus = { title: 'Uploading e-Signature', progress: 0, message: 'Starting upload...' };
        this.simulateUpload('eSignature');
      }
    },
    simulateUpload(type) {
      const statusKey = `${type}Status`;
      const interval = setInterval(() => {
        this[statusKey].progress += 20;
        this[statusKey].message = `${this[statusKey].progress}% Uploaded`;
        if (this[statusKey].progress >= 100) {
          clearInterval(interval);
          this[statusKey] = { title: `${type === 'photo' ? 'Photo' : 'e-Signature'} Uploaded`, progress: 100, message: 'Successfully uploaded!' };
          this.form[type] = URL.createObjectURL(this[`${type}File`]);
        }
      }, 200);
    },
    async updateDetails() {
      this.isUpdating = true;
      this.error = '';
      console.log('Updating profile with:', this.form);

      try {
        this.validateAadhar();
        this.validateABCId();
        if (!this.form.name || !this.form.aadharNumber || !this.form.abcId) {
          this.error = 'All fields (Name, Aadhar Number, ABC ID) are required';
          return;
        }
        if (this.aadharError || this.abcIdError) {
          this.error = this.aadharError || this.abcIdError;
          return;
        }

        const confirmed = await this.showConfirmPopup(
          'Confirm Update',
          'Are you sure you want to update your profile with these details?'
        );
        if (!confirmed) return;

        const formData = new FormData();
        formData.append('name', this.form.name);
        formData.append('dob', this.form.dob);
        formData.append('aadharNumber', this.form.aadharNumber);
        formData.append('abcId', this.form.abcId);
        if (this.photoFile) formData.append('photo', this.photoFile);
        if (this.eSignatureFile) formData.append('eSignature', this.eSignatureFile);

        console.log('Sending PUT to /api/public-enrollment/profile/', this.form.registerNo, formData);
        const response = await axios.put(`/api/public-enrollment/profile/${this.form.registerNo}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        console.log('Update response:', response.data);

        if (this.photoFile) this.photoStatus.message = 'Successfully updated on server!';
        if (this.eSignatureFile) this.eSignatureStatus.message = 'Successfully updated on server!';
        await this.showPopupMessage('Profile Updated', 'Your profile has been successfully updated! Moving to enrollment confirmation.');
        console.log('Moving to step 3');
        this.step = 3;
      } catch (err) {
        const errorMsg = err.response?.data?.error || err.message || 'Error updating profile';
        console.error('Update error:', err.response?.status, errorMsg);
        this.error = errorMsg;
        if (this.photoFile) this.photoStatus = { title: 'Photo Upload Failed', progress: 100, message: 'Error: ' + errorMsg };
        if (this.eSignatureFile) this.eSignatureStatus = { title: 'e-Signature Upload Failed', progress: 100, message: 'Error: ' + errorMsg };
        throw err; // Re-throw to see the error in the console
      } finally {
        this.isUpdating = false;
      }
    },
    async registerForExam() {
      this.isEnrolling = true;
      try {
        await axios.post('/api/public-enrollment', {
          studentId: this.form.studentId,
          courseId: this.courseId,
        });
        await this.showPopupMessage('Enrollment Successful', `You are enrolled in ${this.course.name}! Please log in to complete payment and access the course.`);
        setTimeout(() => this.$router.push({ path: '/', query: { enrolled: this.courseId } }), 2000);
      } catch (err) {
        this.error = err.response?.data?.error || 'Enrollment failed';
        console.error('Register for exam error:', err);
      } finally {
        this.isEnrolling = false;
      }
    },
    goToPMU() {
      window.location.href = 'https://pmu.edu';
    },
  },
  created() {
    this.fetchCourse();
  },
  directives: {
    'no-right-click': {
      mounted(el) {
        el.addEventListener('contextmenu', (e) => e.preventDefault());
      }
    }
  }
};
</script>

<style scoped>
.h-screen {
  height: 100vh;
}
.overflow-hidden {
  overflow: hidden;
}
.pt-16 {
  padding-top: 4rem;
}
.animate-spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
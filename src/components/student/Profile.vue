<template>
  <div class="p-6 md:p-10 font-sans">
    <!-- Header -->
    <div class="max-w-4xl mx-auto mb-8">
      <div class="flex items-center space-x-4">
        <svg class="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <h2 class="text-2xl font-bold text-gray-800">My Profile</h2>
      </div>
    </div>

    <!-- Profile Card -->
    <div class="max-w-4xl mx-auto bg-gray-50 rounded-lg shadow-sm border border-gray-200 p-8" v-if="profile.registerNo">
      <form @submit.prevent="updateProfile" class="space-y-6">
        <!-- Name -->
        <div class="flex items-center space-x-4">
          <svg class="w-6 h-6 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
          </svg>
          <div class="flex-1">
            <label class="text-sm font-medium text-gray-600">Full Name</label>
            <input
              v-model="profile.name"
              type="text"
              placeholder="Enter your name"
              class="mt-1 w-full p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
            >
          </div>
        </div>

        <!-- Register Number -->
        <div class="flex items-center space-x-4">
          <svg class="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3h14v18H5V3z" />
          </svg>
          <div class="flex-1">
            <label class="text-sm font-medium text-gray-600">Register Number</label>
            <input
              v-model="profile.registerNo"
              type="text"
              placeholder="Enter register number"
              class="mt-1 w-full p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              readonly
            >
          </div>
        </div>

        <!-- Date of Birth -->
        <div class="flex items-center space-x-4">
          <svg class="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <div class="flex-1">
            <label class="text-sm font-medium text-gray-600">Date of Birth</label>
            <input
              v-model="profile.dob"
              type="date"
              class="mt-1 w-full p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
            >
          </div>
        </div>

        <!-- Password -->
        <div class="flex items-center space-x-4">
          <svg class="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11c0-1.1.9-2 2-2s2 .9 2 2-2 4-2 4m-4-4c0-1.1.9-2 2-2s2 .9 2 2m-6 4h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <div class="flex-1">
            <label class="text-sm font-medium text-gray-600">Password</label>
            <input
              v-model="newPassword"
              type="password"
              placeholder="Enter new password (leave blank to keep current)"
              class="mt-1 w-full p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              @input="validatePassword"
            >
            <span v-if="passwordError" class="text-red-500 text-xs">{{ passwordError }}</span>
          </div>
        </div>

        <!-- Aadhar Number -->
        <div class="flex items-center space-x-4">
          <svg class="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <div class="flex-1">
            <label class="text-sm font-medium text-gray-600">Aadhar Number</label>
            <input
              v-model="profile.aadharNumber"
              type="text"
              placeholder="Enter Aadhar number (12 digits)"
              class="mt-1 w-full p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              @input="validateAadhar"
            >
            <span v-if="aadharError" class="text-red-500 text-xs">{{ aadharError }}</span>
          </div>
        </div>

        <!-- ABC ID -->
        <div class="flex items-center space-x-4">
          <svg class="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2" />
          </svg>
          <div class="flex-1">
            <label class="text-sm font-medium text-gray-600">ABC ID</label>
            <input
              v-model="profile.abcId"
              type="text"
              placeholder="Enter ABC ID (12 alphanumeric)"
              class="mt-1 w-full p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              @input="validateABCId"
            >
            <span v-if="abcIdError" class="text-red-500 text-xs">{{ abcIdError }}</span>
          </div>
        </div>

        <!-- Photo Upload -->
        <div class="flex items-center space-x-4">
          <svg class="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <div class="flex-1">
            <label class="text-sm font-medium text-gray-600">Profile Photo</label>
            <div class="mt-1 flex items-center space-x-4">
              <img
                v-if="profilePhoto"
                :src="profilePhoto"
                alt="Profile Photo"
                class="w-16 h-16 object-cover rounded-full border border-gray-200"
                @error="handleImageError('photo')"
              >
              <button
                @click="showPhotoModal = true"
                type="button"
                class="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-all duration-200"
              >
                {{ profilePhoto ? 'Change Photo' : 'Upload Photo' }}
              </button>
            </div>
          </div>
        </div>

        <!-- eSignature Upload -->
        <div class="flex items-center space-x-4">
          <svg class="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <div class="flex-1">
            <label class="text-sm font-medium text-gray-600">e-Signature</label>
            <div class="mt-1 flex items-center space-x-4">
              <img
                v-if="profileESignature"
                :src="profileESignature"
                alt="e-Signature"
                class="w-24 h-12 object-contain rounded border border-gray-200"
                @error="handleImageError('eSignature')"
              >
              <button
                @click="showESignatureModal = true"
                type="button"
                class="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-all duration-200"
              >
                {{ profileESignature ? 'Change e-Signature' : 'Upload e-Signature' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          :disabled="isUpdating || aadharError || abcIdError || passwordError || !hasChanges"
          class="w-full py-3 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" v-if="!isUpdating">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <svg v-else class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>{{ isUpdating ? 'Updating...' : 'Update Profile' }}</span>
        </button>
        <p v-if="lastUpdateStatus" class="text-sm text-gray-600 mt-2">{{ lastUpdateStatus }}</p>
      </form>
    </div>

    <!-- Photo Upload Modal -->
    <div v-if="showPhotoModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
      <div class="bg-white rounded-xl p-6 w-full max-w-md shadow-lg border border-gray-200">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-800 flex items-center">
            <svg class="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Upload Profile Photo
          </h3>
          <button @click="showPhotoModal = false" class="text-gray-500 hover:text-gray-700">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <input
          type="file"
          ref="photoInput"
          @change="handlePhotoUpload"
          accept="image/*"
          class="w-full p-2 border border-gray-200 rounded-md"
        >
        <div v-if="previewPhoto" class="mt-4">
          <img :src="previewPhoto" alt="Preview Photo" class="w-32 h-32 object-cover rounded-lg border border-gray-200">
        </div>
        <div v-if="uploadProgress.photo > 0" class="mt-4">
          <div class="w-full bg-gray-200 rounded-full h-2.5">
            <div class="bg-indigo-500 h-2.5 rounded-full" :style="{ width: `${uploadProgress.photo}%` }"></div>
          </div>
          <p class="text-sm text-gray-600 mt-1">{{ uploadProgress.photo }}% Uploaded</p>
        </div>
        <button
          @click="confirmPhotoUpload"
          :disabled="uploadProgress.photo < 100"
          class="mt-4 w-full py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Confirm
        </button>
      </div>
    </div>

    <!-- eSignature Upload Modal -->
    <div v-if="showESignatureModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
      <div class="bg-white rounded-xl p-6 w-full max-w-md shadow-lg border border-gray-200">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-800 flex items-center">
            <svg class="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Upload e-Signature
          </h3>
          <button @click="showESignatureModal = false" class="text-gray-500 hover:text-gray-700">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <input
          type="file"
          ref="eSignatureInput"
          @change="handleESignatureUpload"
          accept="image/*"
          class="w-full p-2 border border-gray-200 rounded-md"
        >
        <div v-if="previewESignature" class="mt-4">
          <img :src="previewESignature" alt="Preview e-Signature" class="w-48 h-16 object-contain rounded border border-gray-200">
        </div>
        <div v-if="uploadProgress.eSignature > 0" class="mt-4">
          <div class="w-full bg-gray-200 rounded-full h-2.5">
            <div class="bg-indigo-500 h-2.5 rounded-full" :style="{ width: `${uploadProgress.eSignature}%` }"></div>
          </div>
          <p class="text-sm text-gray-600 mt-1">{{ uploadProgress.eSignature }}% Uploaded</p>
        </div>
        <button
          @click="confirmESignatureUpload"
          :disabled="uploadProgress.eSignature < 100"
          class="mt-4 w-full py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  props: ['user'],
  data() {
    return {
      profile: {
        name: '',
        registerNo: '',
        dob: '',
        aadharNumber: '',
        abcId: '',
        photo: null,
        eSignature: null,
      },
      originalProfile: {},
      newPassword: '', // For password updates
      photoFile: null,
      eSignatureFile: null,
      previewPhoto: null,
      previewESignature: null,
      showPhotoModal: false,
      showESignatureModal: false,
      uploadProgress: {
        photo: 0,
        eSignature: 0,
      },
      isUpdating: false,
      aadharError: '',
      abcIdError: '',
      passwordError: '',
      lastUpdateStatus: '',
      profilePhoto: null, // Computed URL for profile photo
      profileESignature: null, // Computed URL for e-signature
      baseUrl: '', // Base URL for API requests
    };
  },
  computed: {
    hasChanges() {
      const fields = ['name', 'dob', 'aadharNumber', 'abcId'];
      return fields.some(key => this.profile[key] !== this.originalProfile[key] && this.profile[key].trim() !== '') ||
             this.newPassword.trim() !== '' ||
             this.photoFile !== null || 
             this.eSignatureFile !== null;
    },
  },
  methods: {
    async fetchProfile() {
      try {
        if (!this.user || !this.user.registerNo) {
          throw new Error('No register number provided in user data. Please log in again.');
        }
        const registerNo = this.user.registerNo;
        const url = `/api/student-profile/profile/${registerNo}`;
        console.log('Fetching profile from:', `${this.baseUrl}${url}`);

        const response = await axios.get(url, { withCredentials: true });
        const data = response.data;

        if (!data || typeof data !== 'object') {
          throw new Error('Invalid profile data received from server');
        }

        this.profile = {
          name: data.name || '',
          registerNo: data.registerNo || registerNo,
          dob: data.dob || '',
          aadharNumber: data.aadharNumber || '',
          abcId: data.abcId || '',
          photo: data.photo || null,
          eSignature: data.eSignature || null,
        };
        this.originalProfile = { ...this.profile };
        this.updateImageUrls(); // Update computed image URLs
        this.aadharError = '';
        this.abcIdError = '';
        this.passwordError = '';
        this.lastUpdateStatus = 'Profile loaded successfully';
        console.log('Profile fetched:', this.profile);

        // Emit the updated profile to the parent (Dashboard.vue)
        this.$emit('profile-updated', this.profile);
      } catch (error) {
        console.error('Error fetching profile:', error.response ? error.response.data : error.message);
        this.lastUpdateStatus = `Failed to load profile: ${error.response ? error.response.data.error || error.message : error.message}`;
        if (error.response && error.response.status === 401) {
          this.$emit('logout');
          this.$router.push('/');
        }
        this.$emit('show-message', this.lastUpdateStatus);
      }
    },
    async updateBaseUrl() {
      try {
        const response = await axios.get('/api/config/base-url');
        this.baseUrl = response.data.baseURL;
        console.log('Base URL set to:', this.baseUrl);
      } catch (error) {
        console.error('Error fetching base URL:', error);
        this.baseUrl = 'http://localhost:3000'; // Fallback
        console.log('Using fallback base URL:', this.baseUrl);
      }
    },
    updateImageUrls() {
      // Construct full URLs for the images using the base URL
      this.profilePhoto = this.profile.photo ? `${this.baseUrl}${this.profile.photo}` : null;
      this.profileESignature = this.profile.eSignature ? `${this.baseUrl}${this.profile.eSignature}` : null;
    },
    validateAadhar() {
      this.aadharError = this.profile.aadharNumber && !/^\d{12}$/.test(this.profile.aadharNumber)
        ? 'Aadhar number must be 12 numeric digits'
        : '';
    },
    validateABCId() {
      this.abcIdError = this.profile.abcId && !/^[a-zA-Z0-9]{12}$/.test(this.profile.abcId)
        ? 'ABC ID must be 12 alphanumeric characters'
        : '';
    },
    validatePassword() {
      this.passwordError = this.newPassword && this.newPassword.length < 8
        ? 'Password must be at least 8 characters long'
        : '';
    },
    handlePhotoUpload(event) {
      const file = event.target.files[0];
      if (file && this.isValidFile(file)) {
        this.photoFile = file;
        this.previewPhoto = URL.createObjectURL(file);
        this.simulateUpload('photo');
      } else {
        this.$emit('show-message', 'Invalid file type or size. Please upload a JPEG, JPG, or PNG file under 5MB.');
        this.$refs.photoInput.value = '';
        this.previewPhoto = null;
      }
    },
    handleESignatureUpload(event) {
      const file = event.target.files[0];
      if (file && this.isValidFile(file)) {
        this.eSignatureFile = file;
        this.previewESignature = URL.createObjectURL(file);
        this.simulateUpload('eSignature');
      } else {
        this.$emit('show-message', 'Invalid file type or size. Please upload a JPEG, JPG, or PNG file under 5MB.');
        this.$refs.eSignatureInput.value = '';
        this.previewESignature = null;
      }
    },
    handleImageError(type) {
      console.error(`Failed to load ${type} image`);
      if (type === 'photo') {
        this.profilePhoto = null;
      } else if (type === 'eSignature') {
        this.profileESignature = null;
      }
    },
    isValidFile(file) {
      const filetypes = /jpeg|jpg|png/;
      const extname = filetypes.test(file.name.toLowerCase().split('.').pop());
      const mimetype = filetypes.test(file.type);
      return extname && mimetype && file.size <= 5000000; // 5MB limit
    },
    simulateUpload(type) {
      this.uploadProgress[type] = 0;
      const interval = setInterval(() => {
        if (this.uploadProgress[type] < 90) {
          this.uploadProgress[type] += 10;
        } else {
          this.uploadProgress[type] = 100;
          clearInterval(interval);
        }
      }, 200);
    },
    confirmPhotoUpload() {
      this.showPhotoModal = false;
      if (this.photoFile) {
        // Temporarily update for UI until the server response updates it
        this.profilePhoto = this.previewPhoto;
      }
    },
    confirmESignatureUpload() {
      this.showESignatureModal = false;
      if (this.eSignatureFile) {
        // Temporarily update for UI until the server response updates it
        this.profileESignature = this.previewESignature;
      }
    },
    async updateProfile() {
      this.isUpdating = true;
      this.lastUpdateStatus = 'Updating profile...';
      try {
        this.validateAadhar();
        this.validateABCId();
        this.validatePassword();
        if (this.aadharError || this.abcIdError || this.passwordError) {
          throw new Error('Please fix the validation errors before submitting.');
        }

        const formData = new FormData();
        const fields = ['name', 'dob', 'aadharNumber', 'abcId'];
        
        fields.forEach(key => {
          if (this.profile[key] !== this.originalProfile[key] && this.profile[key].trim() !== '') {
            formData.append(key, this.profile[key]);
            console.log(`Appending ${key}:`, this.profile[key]);
          }
        });

        if (this.newPassword.trim() !== '') {
          formData.append('password', this.newPassword);
          console.log('Appending password');
        }
        
        if (this.photoFile) {
          formData.append('photo', this.photoFile);
          console.log('Appending photo file:', this.photoFile.name);
        }
        if (this.eSignatureFile) {
          formData.append('eSignature', this.eSignatureFile);
          console.log('Appending eSignature file:', this.eSignatureFile.name);
        }

        if (!this.hasChanges) {
          this.lastUpdateStatus = 'No changes to update';
          this.$emit('show-message', this.lastUpdateStatus);
          return;
        }

        const url = `/api/student-profile/profile/${this.originalProfile.registerNo}`;
        console.log('Updating profile at:', `${this.baseUrl}${url}`, 'with formData:', Array.from(formData.entries()));
        const response = await axios.put(url, formData, {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        const { profile: updatedProfile } = response.data;
        this.profile = {
          name: updatedProfile.name || this.profile.name,
          registerNo: updatedProfile.registerNo || this.profile.registerNo,
          dob: updatedProfile.dob || this.profile.dob,
          aadharNumber: updatedProfile.aadharNumber || this.profile.aadharNumber,
          abcId: updatedProfile.abcId || this.profile.abcId,
          photo: updatedProfile.photo || this.profile.photo,
          eSignature: updatedProfile.eSignature || this.profile.eSignature,
        };
        this.originalProfile = { ...this.profile };
        this.previewPhoto = null;
        this.previewESignature = null;
        this.newPassword = '';
        this.photoFile = null;
        this.eSignatureFile = null;

        this.updateImageUrls(); // Update computed image URLs after server response

        this.lastUpdateStatus = response.data.message || 'Profile updated successfully';
        this.$emit('show-message', this.lastUpdateStatus);

        // Emit the updated profile to the parent (Dashboard.vue)
        this.$emit('profile-updated', this.profile);
      } catch (error) {
        console.error('Error updating profile:', error.response ? error.response.data : error.message);
        this.lastUpdateStatus = `Failed to update profile: ${error.response ? error.response.data.error || error.message : error.message}`;
        if (error.response && error.response.status === 401) {
          this.$emit('logout');
          this.$router.push('/');
        }
        this.$emit('show-message', this.lastUpdateStatus);
      } finally {
        this.isUpdating = false;
      }
    },
  },
  async created() {
    await this.updateBaseUrl(); // Fetch the base URL on component creation
    console.log('Profile.vue initialized with user:', this.user);
    if (!this.user || !this.user.registerNo) {
      console.error('User prop missing registerNo:', this.user);
      this.lastUpdateStatus = 'Please log in again to access your profile.';
      this.$emit('show-message', this.lastUpdateStatus);
      this.$emit('logout');
      this.$router.push('/');
    } else {
      await this.fetchProfile();
    }
  },
};
</script>

<style scoped>
/* Font imports (using sans-serif as fallback, aligning with AdminDashboard) */
.font-sans {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Input and button hover effects */
input:focus, button:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
}

button:hover {
  transform: translateY(-1px);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .p-6 {
    padding: 1rem;
  }
  .md\:p-10 {
    padding: 1.5rem;
  }
}
</style>
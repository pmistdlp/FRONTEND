<!-- client/src/components/admin/Faculty.vue -->
<template>
  <div class="space-y-6 p-4 bg-white text-gray-800">
    <!-- Flash Card for Username Exists -->
    <transition name="fade">
      <div v-if="showUsernameWarning" 
           class="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-md shadow-md z-50 text-sm">
        Username already exists! Please choose a different username.
      </div>
    </transition>

    <!-- Success Popup -->
    <div v-if="showSuccessPopup" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg shadow-lg border border-gray-200 w-full max-w-sm text-center">
        <!-- Icon based on action -->
        <div class="mb-4">
          <CheckCircleIcon v-if="successAction === 'created'" class="w-12 h-12 text-green-500 mx-auto" />
          <PencilIcon v-else-if="successAction === 'updated'" class="w-12 h-12 text-blue-500 mx-auto" />
          <TrashIcon v-else-if="successAction === 'deleted'" class="w-12 h-12 text-red-500 mx-auto" />
        </div>
        <!-- Message -->
        <h3 class="text-lg font-semibold mb-2" :class="{
          'text-green-500': successAction === 'created',
          'text-blue-500': successAction === 'updated',
          'text-red-500': successAction === 'deleted'
        }">
          {{ successAction === 'created' ? 'Account Created' : successAction === 'updated' ? 'Account Updated' : 'Account Deleted' }}
        </h3>
        <p class="text-gray-600 mb-4 text-sm">
          {{ successMessage }}
        </p>
        <!-- Okay Button -->
        <button @click="closeSuccessPopup" 
                class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-all duration-200 text-sm">
          Okay
        </button>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="isLoading" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
      <div class="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid"></div>
    </div>

    <h2 class="text-2xl font-bold transition-all duration-300 hover:text-blue-600">Faculty Dashboard</h2>

    <!-- Faculty Form -->
    <div class="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
      <h3 class="text-base font-semibold text-blue-500 mb-4">
        {{ editingFaculty ? 'Edit Faculty' : 'New Faculty' }}
      </h3>
      <form @submit.prevent="saveFaculty" class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Name</label>
            <input v-model="faculty.name" placeholder="Enter name" required 
                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 text-sm" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Username</label>
            <input v-model="faculty.username" placeholder="Enter username" required 
                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 text-sm" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Faculty ID</label>
            <input v-model="faculty.facultyId" placeholder="Enter faculty ID" required 
                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 text-sm" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Email</label>
            <input v-model="faculty.email" placeholder="Enter email" required 
                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 text-sm" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Password</label>
            <input v-model="faculty.password" type="password" 
                   :placeholder="editingFaculty ? 'Leave blank to keep' : 'Enter password'" 
                   :required="!editingFaculty" 
                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 text-sm" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Confirm Password</label>
            <input v-model="faculty.confirmPassword" type="password" 
                   :placeholder="editingFaculty ? 'Leave blank to keep' : 'Confirm password'" 
                   :required="!editingFaculty" 
                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 text-sm" />
          </div>
          <div class="sm:col-span-2">
            <label class="block text-xs font-medium text-gray-700 mb-1">Department</label>
            <select v-model="faculty.department" required 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 text-sm">
              <option value="" disabled>Select Department</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Computer Applications">Computer Applications</option>
              <option value="Informatics">Informatics</option>
              <option value="Computer Science & Engineering">Computer Science & Engineering</option>
            </select>
          </div>
        </div>
        <div class="flex items-center">
          <input type="checkbox" v-model="faculty.isMaster" 
                 class="mr-2 h-4 w-4 text-blue-500 focus:ring-blue-500 bg-white border-gray-300" />
          <label class="text-sm text-gray-600">Master Admin</label>
        </div>
        <div class="flex space-x-2">
          <button type="submit" 
                  class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-all duration-200 text-sm">
            {{ editingFaculty ? 'Update' : 'Create' }}
          </button>
          <button v-if="editingFaculty" type="button" @click="cancelEdit" 
                  class="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-all duration-200 text-sm">
            Cancel
          </button>
        </div>
      </form>
    </div>

    <!-- Faculty List -->
    <div class="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
      <h3 class="text-base font-semibold text-blue-500 mb-4">Faculty List</h3>
      <div class="overflow-x-auto">
        <table class="min-w-full bg-white border border-gray-200 rounded-md text-sm">
          <thead class="bg-gray-100">
            <tr>
              <th class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">Name</th>
              <th class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">Username</th>
              <th class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">Faculty ID</th>
              <th class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">Department</th>
              <th class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">Email</th>
              <th class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="f in facultyList" :key="f.id" class="hover:bg-gray-50 transition-all duration-200">
              <td class="py-2 px-3 border-b border-gray-200">{{ f.name }}</td>
              <td class="py-2 px-3 border-b border-gray-200">{{ f.username }}</td>
              <td class="py-2 px-3 border-b border-gray-200">{{ f.facultyId }}</td>
              <td class="py-2 px-3 border-b border-gray-200 text-gray-500">{{ f.department }}</td>
              <td class="py-2 px-3 border-b border-gray-200">{{ f.email }}</td>
              <td class="py-2 px-3 border-b border-gray-200 flex space-x-2">
                <button @click="editFaculty(f)" class="text-blue-500 hover:text-blue-700 transition-colors">
                  <PencilIcon class="w-4 h-4" />
                </button>
                <button @click="showDeletePopup(f.id)" class="text-red-500 hover:text-red-700 transition-colors">
                  <TrashIcon class="w-4 h-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Delete Popup -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-4 rounded-lg shadow-lg border border-gray-200 w-full max-w-md">
        <h3 class="text-base font-semibold text-red-500 mb-4">Confirm Deletion</h3>
        <p class="text-gray-800 mb-4 text-sm">Are you sure you want to delete this faculty member? This action cannot be undone.</p>
        <div class="flex justify-end space-x-2">
          <button @click="confirmDelete" 
                  class="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-all duration-200 text-sm">
            Delete
          </button>
          <button @click="closeDeleteModal" 
                  class="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-all duration-200 text-sm">
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { defineComponent } from 'vue';
import { PencilIcon, TrashIcon, CheckCircleIcon } from '@heroicons/vue/24/solid';
import apiConfig from '@/config/apiConfig';

const axiosInstance = axios.create({
  baseURL: apiConfig.baseURL,
});

export default defineComponent({
  components: { PencilIcon, TrashIcon, CheckCircleIcon },
  props: {
    facultyList: { type: Array, default: () => [] },
    user: { type: Object, required: true, default: () => ({}) },
  },
  data() {
    return {
      faculty: { name: '', username: '', facultyId: '', email: '', password: '', confirmPassword: '', department: '', isMaster: false },
      editingFaculty: null,
      isLoading: false,
      showDeleteModal: false,
      facultyIdToDelete: null,
      showUsernameWarning: false,
      showSuccessPopup: false,
      successAction: '',
      successMessage: '',
    };
  },
  watch: {
    facultyList(newList) {
      console.log('Faculty List:', newList); // Debug to verify facultyId
    },
  },
  methods: {
    async saveFaculty() {
      if (this.faculty.password !== this.faculty.confirmPassword) {
        alert('Passwords do not match');
        return;
      }

      const facultyData = {
        name: this.faculty.name,
        username: this.faculty.username,
        facultyId: this.faculty.facultyId,
        email: this.faculty.email,
        department: this.faculty.department,
        isMaster: this.faculty.isMaster ? 1 : 0,
      };

      if (this.faculty.password && !this.editingFaculty) {
        facultyData.password = this.faculty.password;
      } else if (this.editingFaculty && this.faculty.password) {
        facultyData.password = this.faculty.password;
      }

      this.isLoading = true;
      try {
        if (this.editingFaculty) {
          await axiosInstance.put(`/api/staff/${this.editingFaculty.id}`, facultyData);
          this.showSuccessPopup = true;
          this.successAction = 'updated';
          this.successMessage = `Faculty ${this.faculty.name} has been successfully updated.`;
        } else {
          await axiosInstance.post('/api/staff', facultyData);
          this.showSuccessPopup = true;
          this.successAction = 'created';
          this.successMessage = `Faculty ${this.faculty.name} has been successfully created.`;
        }
        this.$emit('fetchFaculty');
        this.resetFacultyForm();
      } catch (error) {
        console.error('Error saving faculty:', error.response ? error.response.data : error.message);
        if (error.response && error.response.status === 400 && error.response.data.error.includes('UNIQUE constraint failed: staff.username')) {
          this.showUsernameWarning = true;
          setTimeout(() => {
            this.showUsernameWarning = false;
          }, 5000);
        } else {
          alert(`Failed to save faculty. Error: ${error.response ? error.response.data.error : error.message}`);
        }
      } finally {
        this.isLoading = false;
      }
    },
    async editFaculty(faculty) {
      this.isLoading = true;
      try {
        const { data } = await axiosInstance.get(`/api/staff/${faculty.id}`);
        this.faculty = { 
          ...data, 
          facultyId: data.facultyid, // Map facultyid to facultyId
          password: '', 
          confirmPassword: '', 
          isMaster: data.ismaster === 1 
        };
        this.editingFaculty = { ...data, facultyId: data.facultyid };
      } catch (error) {
        console.error('Error fetching faculty details:', error.response ? error.response.data : error.message);
        alert(`Failed to load faculty details. Error: ${error.response ? error.response.data.error : error.message}`);
      } finally {
        this.isLoading = false;
      }
    },
    showDeletePopup(id) {
      this.facultyIdToDelete = id;
      this.showDeleteModal = true;
    },
    async confirmDelete() {
      this.isLoading = true;
      try {
        const { data } = await axiosInstance.get(`/api/staff/${this.facultyIdToDelete}`);
        await axiosInstance.delete(`/api/staff/${this.facultyIdToDelete}`);
        this.showSuccessPopup = true;
        this.successAction = 'deleted';
        this.successMessage = `Faculty ${data.name} has been successfully deleted.`;
        this.$emit('fetchFaculty');
        this.closeDeleteModal();
      } catch (error) {
        console.error('Error deleting faculty:', error.response ? error.response.data : error.message);
        alert(`Failed to delete faculty. Error: ${error.response ? error.response.data.error : error.message}`);
      } finally {
        this.isLoading = false;
      }
    },
    closeDeleteModal() {
      this.showDeleteModal = false;
      this.facultyIdToDelete = null;
    },
    resetFacultyForm() {
      this.faculty = { name: '', username: '', facultyId: '', email: '', password: '', confirmPassword: '', department: '', isMaster: false };
      this.editingFaculty = null;
    },
    cancelEdit() {
      this.resetFacultyForm();
    },
    closeSuccessPopup() {
      this.showSuccessPopup = false;
      this.successAction = '';
      this.successMessage = '';
    },
  },
  created() {
    this.$emit('fetchFaculty');
  },
});
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
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
.list-enter-active, .list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from, .list-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
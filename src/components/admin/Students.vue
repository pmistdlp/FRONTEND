```vue
<template>
  <div class="space-y-6 p-4 bg-white text-gray-800">
    <!-- Loading Overlay -->
    <div v-if="isLoading" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
      <div class="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid"></div>
      <p class="text-white ml-4">Processing...</p>
    </div>

    <h2 class="text-2xl font-bold transition-all duration-300 hover:text-blue-600">Learners Dashboard</h2>

    <!-- New/Edit Student Form -->
    <div class="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
      <h3 class="text-base font-semibold text-blue-500 mb-4">
        {{ editingStudent ? 'Edit Learner' : 'New Learner' }}
      </h3>
      <form @submit.prevent="saveStudent" class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Learner Name</label>
            <input v-model="student.name" placeholder="Enter student name" required 
                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 text-sm" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Register No</label>
            <input v-model="student.registerNo" placeholder="Enter register no" required 
                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 text-sm" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">DOB (DDMMYYYY)</label>
            <input v-model="student.dob" placeholder="DDMMYYYY" required 
                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 text-sm" 
                   @input="student.password = student.dob" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Password</label>
            <input v-model="student.password" type="text" placeholder="Auto-set to DOB" required readonly
                   class="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Aadhar Number (optional)</label>
            <input v-model="student.aadharNumber" placeholder="Enter Aadhar number" 
                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 text-sm" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">ABC ID (optional)</label>
            <input v-model="student.abcId" placeholder="Enter ABC ID" 
                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 text-sm" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Profile Photo (optional)</label>
            <div class="flex items-center space-x-2">
              <button type="button" @click="showPhotoModal = true"
                      class="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-all duration-200 text-sm">
                {{ studentPhoto ? 'Change Photo' : 'Upload Photo' }}
              </button>
              <img v-if="studentPhoto" :src="studentPhoto" alt="Profile Photo" 
                   class="w-8 h-8 object-cover rounded-full border border-gray-200" 
                   @error="handleImageError('photo')" />
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">e-Signature (optional)</label>
            <div class="flex items-center space-x-2">
              <button type="button" @click="showESignatureModal = true"
                      class="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-all duration-200 text-sm">
                {{ studentESignature ? 'Change e-Signature' : 'Upload e-Signature' }}
              </button>
              <img v-if="studentESignature" :src="studentESignature" alt="e-Signature" 
                   class="w-12 h-6 object-contain rounded border border-gray-200" 
                   @error="handleImageError('eSignature')" />
            </div>
          </div>
        </div>
        <div class="flex space-x-2">
          <button type="submit" 
                  class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-all duration-200 text-sm">
            {{ editingStudent ? 'Update' : 'Create' }}
          </button>
          <button v-if="editingStudent" type="button" @click="cancelStudentEdit" 
                  class="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-all duration-200 text-sm">
            Cancel
          </button>
          <label class="bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-600 transition-all duration-200 cursor-pointer text-sm">
            Upload Students
            <input type="file" ref="fileInput" @change="handleFileUpload" accept=".csv,.xlsx,.xls" class="hidden" />
          </label>
          <button @click="downloadTemplate" type="button"
                  class="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-all duration-200 text-sm">
            Download Template
          </button>
        </div>
      </form>
    </div>

    <!-- Search Box and Bulk Delete Button -->
    <div class="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-4 sm:space-y-0">
      <div class="flex-1">
        <h3 class="text-base font-semibold text-blue-500 mb-2">Search Students</h3>
        <input v-model="searchQuery" placeholder="Search by name or register number..."
               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 text-sm" />
      </div>
      <div class="flex items-end pt-8">
        <button @click="showBulkDeleteConfirmation" 
                :disabled="selectedStudentIds.length === 0"
                class="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 disabled:bg-gray-400 transition-all duration-200 text-sm">
          Bulk Delete ({{ selectedStudentIds.length }})
        </button>
      </div>
    </div>

    <!-- Student List -->
    <div class="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
      <h3 class="text-base font-semibold text-blue-500 mb-4">Student List</h3>
      <div class="overflow-x-auto">
        <table class="min-w-full bg-white border border-gray-200 rounded-md text-sm">
          <thead class="bg-gray-100">
            <tr>
              <th class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">
                <input type="checkbox" v-model="selectAllStudents" @change="toggleSelectAllStudents" class="h-4 w-4 rounded-full" />
              </th>
              <th class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">Photo</th>
              <th class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">e-Signature</th>
              <th class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">Name</th>
              <th class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">Register No</th>
              <th class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">DOB</th>
              <th class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">Aadhar</th>
              <th class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">ABC ID</th>
              <th class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">Source</th>
              <th class="py-2 px-3 text-left text-gray-600 font-semibold border-b border-gray-200">Actions</th>
            </tr>
          </thead>
          <transition-group name="list" tag="tbody">
            <tr v-for="s in filteredStudents" :key="s.id" class="hover:bg-gray-50 transition-all duration-200">
              <td class="py-2 px-3 border-b border-gray-200">
                <input type="checkbox" v-model="selectedStudentIds" :value="s.id" class="h-4 w-4 rounded-full" />
              </td>
              <td class="py-2 px-3 border-b border-gray-200">
                <div class="relative group">
                  <!-- If photo exists, show green tick icon -->
                  <CheckCircleIcon v-if="s.photo" class="w-8 h-8 text-green-500" />
                  <!-- If no photo, show letter avatar -->
                  <div
                    v-else
                    class="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center bg-blue-100 text-blue-600 text-xs font-semibold"
                    :title="s.name"
                  >
                    {{ getInitials(s.name) }}
                  </div>
                  <!-- Tooltip for photo presence -->
                  <span
                    v-if="s.photo"
                    class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                  >
                    Photo Uploaded
                  </span>
                </div>
              </td>
              <td class="py-2 px-3 border-b border-gray-200">
                <div class="relative group">
                  <!-- If eSignature exists, show green tick icon -->
                  <CheckCircleIcon v-if="s.eSignature" class="w-8 h-8 text-green-500" />
                  <!-- If no eSignature, show red cross icon -->
                  <XCircleIcon v-else class="w-8 h-8 text-red-500" />
                  <!-- Tooltip for eSignature presence -->
                  <span
                    class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                  >
                    {{ s.eSignature ? 'e-Signature Uploaded' : 'No e-Signature' }}
                  </span>
                </div>
              </td>
              <td class="py-2 px-3 border-b border-gray-200">{{ s.name }}</td>
              <td class="py-2 px-3 border-b border-gray-200">{{ s.registerNo }}</td>
              <td class="py-2 px-3 border-b border-gray-200">{{ s.dob }}</td>
              <td class="py-2 px-3 border-b border-gray-200">{{ s.aadharNumber || 'N/A' }}</td>
              <td class="py-2 px-3 border-b border-gray-200">{{ s.abcId || 'N/A' }}</td>
              <td class="py-2 px-3 border-b border-gray-200">{{ s.source }}</td>
              <td class="py-2 px-3 border-b border-gray-200 flex space-x-2">
                <div class="relative group">
                  <button @click="editStudent(s)" class="text-blue-500 hover:text-blue-700 transition-colors">
                    <PencilIcon class="w-4 h-4" />
                  </button>
                  <span class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                    Edit Student
                  </span>
                </div>
                <div class="relative group">
                  <button @click="showDeletePopup(s.id)" class="text-red-500 hover:text-red-700 transition-colors">
                    <TrashIcon class="w-4 h-4" />
                  </button>
                  <span class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                    Delete Student
                  </span>
                </div>
                <div class="relative group">
                  <button @click="viewAssignedCourses(s)" class="text-purple-500 hover:text-purple-700 transition-colors">
                    <EyeIcon class="w-4 h-4" />
                  </button>
                  <span class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                    View Assigned Courses
                  </span>
                </div>
              </td>
            </tr>
          </transition-group>
        </table>
      </div>
    </div>

    <!-- Assign Courses to Selected Students -->
    <div class="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
      <h3 class="text-base font-semibold text-blue-500 mb-4">Assign Courses to Selected Students</h3>
      <div class="space-y-2">
        <div class="flex items-center p-2 bg-white rounded-md hover:bg-gray-50 transition-all duration-200">
          <input type="checkbox" v-model="selectAllCourses" @change="toggleSelectAllCourses" class="mr-2 h-4 w-4 rounded-full text-blue-500 focus:ring-blue-500 bg-white border-gray-300" />
          <span class="text-gray-800 flex-1">Select All Courses</span>
        </div>
        <div v-for="c in courses" :key="c.id" class="flex items-center p-2 bg-white rounded-md hover:bg-gray-50 transition-all duration-200">
          <input type="checkbox" 
                 :checked="selectedCourseIds.includes(c.id)" 
                 @change="toggleCourseSelection(c.id)" 
                 class="mr-2 h-4 w-4 rounded-full text-blue-500 focus:ring-blue-500 bg-white border-gray-300" />
          <span class="text-gray-800 flex-1">{{ c.name }} (Exam: {{ c.examDate }} {{ c.examTime }} IST)</span>
        </div>
      </div>
      <div class="mt-4">
        <button @click="showAssignConfirmation" 
                :disabled="selectedStudentIds.length === 0 || selectedCourseIds.length === 0"
                class="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 disabled:bg-gray-400 transition-all duration-200 text-sm">
          Assign Courses
        </button>
      </div>
    </div>

    <!-- Delete Student Popup -->
    <div v-if="showDeleteStudentModal" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-4 rounded-lg shadow-lg border border-gray-200 w-full max-w-md">
        <div class="flex items-center justify-center mb-4">
          <TrashIcon class="w-8 h-8 text-red-500 mr-2" />
          <h3 class="text-base font-semibold text-red-500">Confirm Deletion</h3>
        </div>
        <p class="text-gray-800 mb-4 text-sm">Are you sure you want to delete this student? This action cannot be undone.</p>
        <div class="flex justify-end space-x-2">
          <button @click="confirmDeleteStudent" 
                  class="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-all duration-200 text-sm">
            Delete
          </button>
          <button @click="closeDeleteStudentModal" 
                  class="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-all duration-200 text-sm">
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Bulk Delete Confirmation Modal -->
    <div v-if="showBulkDeleteConfirmationModal" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-4 rounded-lg shadow-lg border border-gray-200 w-full max-w-md">
        <div class="flex items-center justify-center mb-4">
          <TrashIcon class="w-8 h-8 text-red-500 mr-2" />
          <h3 class="text-base font-semibold text-red-500">Confirm Bulk Deletion</h3>
        </div>
        <p class="text-gray-800 mb-4 text-sm">
          Are you sure you want to delete {{ selectedStudentIds.length }} student(s)? This action cannot be undone.
        </p>
        <div class="flex justify-end space-x-2">
          <button @click="confirmBulkDelete" 
                  class="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-all duration-200 text-sm">
            Delete
          </button>
          <button @click="closeBulkDeleteConfirmationModal" 
                  class="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-all duration-200 text-sm">
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Upload Students Confirmation Popup -->
    <div v-if="showUploadPopup" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-4 rounded-lg shadow-lg border border-gray-200 w-full max-w-lg">
        <h3 class="text-base font-semibold text-green-500 mb-4">Students Extracted from File</h3>
        <div class="max-h-64 overflow-y-auto space-y-4">
          <div v-for="(s, index) in extractedStudents" :key="index" class="bg-gray-50 p-4 rounded-md shadow-sm border border-gray-100">
            <p class="text-gray-800 font-medium">Name: {{ s.name }}</p>
            <p class="text-gray-600 text-sm">Register No: {{ s.registerNo }}</p>
            <p class="text-gray-600 text-sm">DOB: {{ s.dob }}</p>
            <p class="text-green-600 font-semibold">Password: {{ s.password }}</p>
            <p class="text-gray-600 text-sm">Aadhar: {{ s.aadharNumber || 'N/A' }}</p>
            <p class="text-gray-600 text-sm">ABC ID: {{ s.abcId || 'N/A' }}</p>
          </div>
        </div>
        <div class="flex justify-end space-x-2 mt-4">
          <button @click="confirmUploadStudents" :disabled="isUploading" 
                  class="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 disabled:bg-gray-400 transition-all duration-200 text-sm">
            {{ isUploading ? 'Uploading...' : 'Confirm Upload' }}
          </button>
          <button @click="cancelUpload" :disabled="isUploading" 
                  class="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 disabled:bg-gray-300 transition-all duration-200 text-sm">
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Assign Courses Confirmation Modal -->
    <div v-if="showAssignConfirmationModal" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-4 rounded-lg shadow-lg border border-gray-200 w-full max-w-md">
        <div class="flex items-center justify-center mb-4">
          <CheckCircleIcon class="w-8 h-8 text-green-500 mr-2" />
          <h3 class="text-base font-semibold text-green-500">Confirm Assignment</h3>
        </div>
        <p class="text-gray-800 mb-4 text-sm">
          Are you sure you want to assign the selected {{ selectedCourseIds.length }} course(s) to {{ selectedStudentIds.length }} student(s)?
        </p>
        <div class="flex justify-end space-x-2">
          <button @click="confirmAssignCourses" 
                  class="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-all duration-200 text-sm">
            Confirm
          </button>
          <button @click="closeAssignConfirmationModal" 
                  class="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-all duration-200 text-sm">
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- View Assigned Courses Modal -->
    <div v-if="showAssignedCoursesModal" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-4 rounded-lg shadow-lg border border-gray-200 w-full max-w-lg">
        <h3 class="text-base font-semibold text-purple-500 mb-4">Assigned Courses for {{ viewedStudent?.name }}</h3>
        <div class="max-h-64 overflow-y-auto space-y-4">
          <div v-if="assignedCourses.length === 0" class="text-gray-500 text-sm">
            No courses assigned to this student.
          </div>
          <div v-else v-for="course in assignedCourses" :key="course.id" class="bg-gray-50 p-4 rounded-md shadow-sm border border-gray-100">
            <div class="flex justify-between items-start">
              <div>
                <p class="text-gray-800 font-medium">{{ course.name }}</p>
                <p class="text-gray-600 text-sm">Course Code: {{ course.course_code || 'N/A' }}</p>
                <p class="text-gray-600 text-sm">Platform: {{ course.learning_platform }}</p>
                <p class="text-gray-600 text-sm">Exam: {{ course.examDate }} {{ course.examTime }} IST</p>
              </div>
              <button @click="showUnassignConfirmation(course.id)" 
                      class="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition-all duration-200 text-sm">
                Remove
              </button>
            </div>
          </div>
        </div>
        <div class="flex justify-end mt-4">
          <button @click="closeAssignedCoursesModal" 
                  class="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-all duration-200 text-sm">
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- Unassign Course Confirmation Modal -->
    <div v-if="showUnassignConfirmationModal" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-4 rounded-lg shadow-lg border border-gray-200 w-full max-w-md">
        <div class="flex items-center justify-center mb-4">
          <TrashIcon class="w-8 h-8 text-red-500 mr-2" />
          <h3 class="text-base font-semibold text-red-500">Confirm Unassignment</h3>
        </div>
        <p class="text-gray-800 mb-4 text-sm">
          Are you sure you want to unassign this course from {{ viewedStudent?.name }}?
        </p>
        <div class="flex justify-end space-x-2">
          <button @click="confirmUnassignCourse" 
                  class="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-all duration-200 text-sm">
            Unassign
          </button>
          <button @click="closeUnassignConfirmationModal" 
                  class="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-all duration-200 text-sm">
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Photo Upload Modal -->
    <div v-if="showPhotoModal" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-4 rounded-lg shadow-lg border border-gray-200 w-full max-w-md">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-base font-semibold text-indigo-500">Upload Profile Photo</h3>
          <button @click="showPhotoModal = false" class="text-gray-500 hover:text-gray-700">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <input type="file" ref="photoInput" @change="handlePhotoUpload" accept="image/*" 
               class="w-full p-2 border border-gray-300 rounded-md text-sm" />
        <div v-if="previewPhoto" class="mt-4">
          <img :src="previewPhoto" alt="Preview Photo" class="w-32 h-32 object-cover rounded-lg border border-gray-200" />
        </div>
        <div v-if="uploadProgress.photo > 0" class="mt-4">
          <div class="w-full bg-gray-200 rounded-full h-2.5">
            <div class="bg-indigo-500 h-2.5 rounded-full" :style="{ width: `${uploadProgress.photo}%` }"></div>
          </div>
          <p class="text-sm text-gray-600 mt-1">{{ uploadProgress.photo }}% Uploaded</p>
        </div>
        <button @click="confirmPhotoUpload" :disabled="uploadProgress.photo < 100" 
                class="mt-4 w-full py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 disabled:bg-gray-400 transition-all duration-200 text-sm">
          Confirm
        </button>
      </div>
    </div>

    <!-- e-Signature Upload Modal -->
    <div v-if="showESignatureModal" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-4 rounded-lg shadow-lg border border-gray-200 w-full max-w-md">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-base font-semibold text-indigo-500">Upload e-Signature</h3>
          <button @click="showESignatureModal = false" class="text-gray-500 hover:text-gray-700">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <input type="file" ref="eSignatureInput" @change="handleESignatureUpload" accept="image/*" 
               class="w-full p-2 border border-gray-300 rounded-md text-sm" />
        <div v-if="previewESignature" class="mt-4">
          <img :src="previewESignature" alt="Preview e-Signature" class="w-48 h-16 object-contain rounded border border-gray-200" />
        </div>
        <div v-if="uploadProgress.eSignature > 0" class="mt-4">
          <div class="w-full bg-gray-200 rounded-full h-2.5">
            <div class="bg-indigo-500 h-2.5 rounded-full" :style="{ width: `${uploadProgress.eSignature}%` }"></div>
          </div>
          <p class="text-sm text-gray-600 mt-1">{{ uploadProgress.eSignature }}% Uploaded</p>
        </div>
        <button @click="confirmESignatureUpload" :disabled="uploadProgress.eSignature < 100" 
                class="mt-4 w-full py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 disabled:bg-gray-400 transition-all duration-200 text-sm">
          Confirm
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import apiConfig from '@/config/apiConfig';
import { defineComponent } from 'vue';
import { PencilIcon, TrashIcon, CheckCircleIcon, EyeIcon, XCircleIcon } from '@heroicons/vue/24/solid';

// Create Axios instance
const api = axios.create({
  withCredentials: true,
  timeout: 30000 // 30 seconds timeout
});

// Interceptor for request logging
api.interceptors.request.use(
  (config) => {
    console.log(`Sending ${config.method.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Interceptor for response logging
api.interceptors.response.use(
  (response) => {
    console.log(`Received response from ${response.config.url}:`, response.status);
    return response;
  },
  (error) => {
    console.error('Response error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

export default defineComponent({
  name: 'Students',
  components: { PencilIcon, TrashIcon, CheckCircleIcon, EyeIcon, XCircleIcon },
  props: {
    user: { type: Object, required: true, default: () => ({}) },
    students: { type: Array, default: () => [] },
    courses: { type: Array, default: () => [] },
  },
  data() {
    return {
      student: { name: '', registerNo: '', dob: '', password: '', aadharNumber: '', abcId: '', photo: null, eSignature: null },
      editingStudent: null,
      isLoading: false,
      isUploading: false,
      showDeleteStudentModal: false,
      showUploadPopup: false,
      showAssignConfirmationModal: false,
      showAssignedCoursesModal: false,
      showBulkDeleteConfirmationModal: false,
      showUnassignConfirmationModal: false,
      showPhotoModal: false,
      showESignatureModal: false,
      studentIdToDelete: null,
      file: null,
      extractedStudents: [],
      selectedStudentIds: [],
      selectedCourseIds: [],
      selectAllStudents: false,
      selectAllCourses: false,
      searchQuery: '',
      viewedStudent: null,
      assignedCourses: [],
      courseIdToUnassign: null,
      photoFile: null,
      eSignatureFile: null,
      previewPhoto: null,
      previewESignature: null,
      studentPhoto: null,
      studentESignature: null,
      uploadProgress: { photo: 0, eSignature: 0 },
      baseUrl: '',
    };
  },
  computed: {
    filteredStudents() {
      if (!this.searchQuery) return this.students;
      const query = this.searchQuery.toLowerCase();
      return this.students.filter(student =>
        student.name.toLowerCase().includes(query) ||
        student.registerNo.toLowerCase().includes(query)
      );
    },
  },
  watch: {
    filteredStudents: {
      handler() {
        this.selectedStudentIds = this.selectedStudentIds.filter(id =>
          this.filteredStudents.some(student => student.id === id)
        );
        this.selectAllStudents = this.selectedStudentIds.length === this.filteredStudents.length && this.filteredStudents.length > 0;
      },
      immediate: true, // Run on initial load
    },
  },
  async created() {
    try {
      const baseURL = await apiConfig.getBaseURL();
      console.log('Setting axios baseURL:', baseURL);
      this.baseUrl = baseURL || 'http://localhost:3000'; // Fallback to local if undefined
      api.defaults.baseURL = this.baseUrl;
      await api.get('/api/student/debug'); // Test connectivity
      this.$emit('fetchStudents');
      this.$emit('fetchCourses');
    } catch (error) {
      console.error('Failed to initialize API:', error);
      this.baseUrl = 'http://localhost:3000'; // Fallback
      api.defaults.baseURL = this.baseUrl;
      this.$emit('fetchStudents');
      this.$emit('fetchCourses');
    }
  },
  methods: {
    async saveStudent() {
      this.isLoading = true;
      try {
        const formData = new FormData();
        formData.append('name', this.student.name);
        formData.append('registerNo', this.student.registerNo);
        formData.append('dob', this.student.dob);
        formData.append('password', this.student.password);
        if (this.student.aadharNumber) formData.append('aadharNumber', this.student.aadharNumber);
        if (this.student.abcId) formData.append('abcId', this.student.abcId);
        formData.append('userType', 'admin');
        formData.append('userId', this.user.id);
        if (this.photoFile) formData.append('photo', this.photoFile);
        if (this.eSignatureFile) formData.append('eSignature', this.eSignatureFile);

        if (!this.student.dob || !this.student.dob.match(/^\d{8}$/)) {
          throw new Error('DOB must be 8 digits (e.g., 28022025 or 12345678)');
        }

        let response;
        if (this.editingStudent) {
          response = await api.put(`/api/student/${this.editingStudent.id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } else {
          response = await api.post('/api/student', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        }
        console.log('Save student response:', response.data); // Log the response to verify the photo path
        this.$emit('fetchStudents');
        this.$emit('fetchStudentHistory');
        this.resetStudentForm();
      } catch (error) {
        const errorMsg = error.response?.data?.error || error.message;
        console.error('Error saving student:', errorMsg);
        alert(`Failed to save student: ${errorMsg}`);
      } finally {
        this.isLoading = false;
      }
    },
    editStudent(student) {
      this.editingStudent = student;
      this.student = { ...student };
      this.studentPhoto = student.photo ? this.getImageUrl(student.photo) : null;
      this.studentESignature = student.eSignature ? this.getImageUrl(student.eSignature) : null;
      this.photoFile = null;
      this.eSignatureFile = null;
      this.previewPhoto = null;
      this.previewESignature = null;
    },
    resetStudentForm() {
      this.student = { name: '', registerNo: '', dob: '', password: '', aadharNumber: '', abcId: '', photo: null, eSignature: null };
      this.editingStudent = null;
      this.photoFile = null;
      this.eSignatureFile = null;
      this.previewPhoto = null;
      this.previewESignature = null;
      this.studentPhoto = null;
      this.studentESignature = null;
      this.uploadProgress = { photo: 0, eSignature: 0 };
      if (this.$refs.photoInput) this.$refs.photoInput.value = '';
      if (this.$refs.eSignatureInput) this.$refs.eSignatureInput.value = '';
    },
    cancelStudentEdit() {
      this.resetStudentForm();
    },
    showDeletePopup(id) {
      this.studentIdToDelete = id;
      this.showDeleteStudentModal = true;
    },
    async confirmDeleteStudent() {
      this.isLoading = true;
      try {
        await api.delete(`/api/student/${this.studentIdToDelete}`, {
          data: { userType: 'admin', userId: this.user.id }
        });
        this.$emit('fetchStudents');
        this.$emit('fetchStudentHistory');
        this.closeDeleteStudentModal();
      } catch (error) {
        const errorMsg = error.response?.data?.error || error.message;
        console.error('Error deleting student:', errorMsg);
        alert(`Failed to delete student: ${errorMsg}`);
      } finally {
        this.isLoading = false;
      }
    },
    closeDeleteStudentModal() {
      this.showDeleteStudentModal = false;
      this.studentIdToDelete = null;
    },
    async handleFileUpload(event) {
      this.file = event.target.files[0];
      if (!this.file) {
        console.error('No file selected');
        return;
      }

      this.isLoading = true;
      const formData = new FormData();
      formData.append('file', this.file);

      try {
        console.log('Uploading file:', {
          name: this.file.name,
          size: this.file.size,
          type: this.file.type,
          url: `${api.defaults.baseURL}/api/student/bulk-upload/preview`
        });
        const response = await api.post('/api/student/bulk-upload/preview', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        this.extractedStudents = response.data.students;
        this.showUploadPopup = true;
      } catch (error) {
        const errorMsg = error.response?.data?.error || error.message;
        console.error('Error uploading file:', errorMsg, error);
        alert(`Failed to process file: ${errorMsg}`);
      } finally {
        this.isLoading = false;
      }
    },
    async confirmUploadStudents() {
      if (this.isUploading) return;

      this.isUploading = true;
      try {
        const response = await api.post('/api/student/bulk-upload/confirm', {
          userType: 'admin',
          userId: this.user.id,
          students: this.extractedStudents
        });
        alert(response.data.message);
        this.$emit('fetchStudents');
        this.$emit('fetchStudentHistory');
        this.showUploadPopup = false;
        this.file = null;
        this.$refs.fileInput.value = '';
      } catch (error) {
        const errorMsg = error.response?.data?.error || error.message;
        console.error('Error confirming upload:', errorMsg);
        alert(`Failed to upload students: ${errorMsg}`);
      } finally {
        this.isUploading = false;
      }
    },
    cancelUpload() {
      this.showUploadPopup = false;
      this.extractedStudents = [];
      this.file = null;
      this.$refs.fileInput.value = '';
    },
    toggleSelectAllStudents() {
      if (this.selectAllStudents) {
        this.selectedStudentIds = this.filteredStudents.map(student => student.id);
      } else {
        this.selectedStudentIds = [];
      }
    },
    toggleSelectAllCourses() {
      if (this.selectAllCourses) {
        this.selectedCourseIds = this.courses.map(course => course.id);
      } else {
        this.selectedCourseIds = [];
      }
    },
    toggleCourseSelection(courseId) {
      const index = this.selectedCourseIds.indexOf(courseId);
      if (index === -1) {
        this.selectedCourseIds.push(courseId);
      } else {
        this.selectedCourseIds.splice(index, 1);
      }
      this.selectAllCourses = this.selectedCourseIds.length === this.courses.length;
    },
    showAssignConfirmation() {
      this.showAssignConfirmationModal = true;
    },
    closeAssignConfirmationModal() {
      this.showAssignConfirmationModal = false;
    },
    async confirmAssignCourses() {
      this.isLoading = true;
      try {
        if (!this.user || !this.user.id || isNaN(this.user.id)) {
          throw new Error('User ID is invalid or not defined. Please log in again.');
        }
        if (!this.selectedStudentIds.length || !this.selectedCourseIds.length) {
          throw new Error('At least one student and one course must be selected.');
        }

        console.log('Preparing to assign courses:', {
          students: this.selectedStudentIds,
          courses: this.selectedCourseIds,
          user: { userType: 'admin', userId: this.user.id }
        });

        if (this.selectedStudentIds.length === 1) {
          const studentIdNum = Number(this.selectedStudentIds[0]);
          if (isNaN(studentIdNum)) {
            throw new Error(`Invalid studentId: ${this.selectedStudentIds[0]}`);
          }

          const response = await api.get(`/api/student/student-courses/${studentIdNum}`);
          const currentCourseIds = response.data.map(course => course.id);

          for (const courseId of this.selectedCourseIds) {
            const courseIdNum = Number(courseId);
            if (isNaN(courseIdNum)) {
              console.warn(`Skipping invalid courseId: ${courseId}`);
              continue;
            }
            if (currentCourseIds.includes(courseIdNum)) {
              console.log(`Skipping: Course ${courseIdNum} already assigned to student ${studentIdNum}`);
              continue;
            }

            await api.post('/api/student/student-courses/single', {
              studentId: studentIdNum,
              courseId: courseIdNum,
              userType: 'admin',
              userId: Number(this.user.id)
            });
          }

          alert(`Course(s) assigned to student ${studentIdNum} successfully`);
        } else {
          const assignments = [];
          for (const studentId of this.selectedStudentIds) {
            const studentIdNum = Number(studentId);
            if (isNaN(studentIdNum)) {
              console.warn(`Skipping invalid studentId: ${studentId}`);
              continue;
            }

            const response = await api.get(`/api/student/student-courses/${studentIdNum}`);
            const currentCourseIds = response.data.map(course => course.id);

            for (const courseId of this.selectedCourseIds) {
              const courseIdNum = Number(courseId);
              if (isNaN(courseIdNum)) {
                console.warn(`Skipping invalid courseId: ${courseId}`);
                continue;
              }
              if (currentCourseIds.includes(courseIdNum)) {
                console.log(`Skipping: Course ${courseIdNum} already assigned to student ${studentIdNum}`);
                continue;
              }
              assignments.push({ studentId: studentIdNum, courseId: courseIdNum });
            }
          }

          if (assignments.length === 0) {
            throw new Error('No new assignments to process. All selected courses are already assigned.');
          }

          console.log('Sending bulk assignment request:', assignments);
          const response = await api.post('/api/student/student-courses/bulk', {
            assignments,
            userType: 'admin',
            userId: Number(this.user.id)
          });

          let message = response.data.message;
          if (response.data.skipped && response.data.skipped.length > 0) {
            message += `\nSkipped: ${response.data.skipped.join('; ')}`;
          }
          alert(message);
        }

        this.closeAssignConfirmationModal();
        this.selectedStudentIds = [];
        this.selectedCourseIds = [];
        this.selectAllStudents = false;
        this.selectAllCourses = false;
        this.$emit('fetchStudents');
        this.$emit('fetchCourses');
      } catch (error) {
        const errorMsg = error.response?.data?.error || error.message;
        const details = error.response?.data?.details ? `\nDetails: ${error.response.data.details.join('; ')}` : '';
        console.error('Error assigning courses:', errorMsg, error);
        alert(`Failed to assign courses: ${errorMsg}${details}`);
      } finally {
        this.isLoading = false;
      }
    },
    async viewAssignedCourses(student) {
      this.viewedStudent = student;
      this.isLoading = true;
      try {
        console.log(`Fetching assigned courses for student ${student.id}`);
        const response = await api.get(`/api/student/student-courses/${student.id}`);
        this.assignedCourses = response.data;
        this.showAssignedCoursesModal = true;
      } catch (error) {
        const errorMsg = error.response?.data?.error || error.message;
        console.error('Error fetching assigned courses:', errorMsg);
        alert(`Failed to fetch assigned courses: ${errorMsg}`);
      } finally {
        this.isLoading = false;
      }
    },
    closeAssignedCoursesModal() {
      this.showAssignedCoursesModal = false;
      this.viewedStudent = null;
      this.assignedCourses = [];
    },
    showBulkDeleteConfirmation() {
      this.showBulkDeleteConfirmationModal = true;
    },
    closeBulkDeleteConfirmationModal() {
      this.showBulkDeleteConfirmationModal = false;
    },
    async confirmBulkDelete() {
      this.isLoading = true;
      try {
        console.log('Bulk deleting students:', this.selectedStudentIds);
        const response = await api.post('/api/student/bulk-delete', {
          studentIds: this.selectedStudentIds,
          userType: 'admin',
          userId: this.user.id
        });
        alert(response.data.message);
        this.$emit('fetchStudents');
        this.$emit('fetchStudentHistory');
        this.closeBulkDeleteConfirmationModal();
        this.selectedStudentIds = [];
        this.selectAllStudents = false;
      } catch (error) {
        const errorMsg = error.response?.data?.error || error.message;
        console.error('Error bulk deleting students:', errorMsg);
        alert(`Failed to bulk delete students: ${errorMsg}`);
      } finally {
        this.isLoading = false;
      }
    },
    showUnassignConfirmation(courseId) {
      this.courseIdToUnassign = courseId;
      this.showUnassignConfirmationModal = true;
    },
    closeUnassignConfirmationModal() {
      this.showUnassignConfirmationModal = false;
      this.courseIdToUnassign = null;
    },
    async confirmUnassignCourse() {
      this.isLoading = true;
      try {
        console.log(`Unassigning course ${this.courseIdToUnassign} from student ${this.viewedStudent.id}`);
        await api.delete('/api/student/student-courses', {
          data: {
            studentId: this.viewedStudent.id,
            courseId: this.courseIdToUnassign,
            userType: 'admin',
            userId: this.user.id
          }
        });
        alert('Course unassigned successfully.');
        const response = await api.get(`/api/student/student-courses/${this.viewedStudent.id}`);
        this.assignedCourses = response.data;
        this.closeUnassignConfirmationModal();
      } catch (error) {
        const errorMsg = error.response?.data?.error || error.message;
        console.error('Error unassigning course:', errorMsg);
        alert(`Failed to unassign course: ${errorMsg}`);
      } finally {
        this.isLoading = false;
      }
    },
    downloadTemplate() {
      const headers = ['Student Name', 'Register No', 'DOB', 'Aadhar Number', 'ABC ID'];
      const sample = ['Mohamed Salman', '122012172036', '28042005', '931802155865', '123456789012'];
      const csvContent = headers.join(',') + '\n' + sample.join(',') + '\n';
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'student_template.csv';
      link.click();
      URL.revokeObjectURL(link.href);
    },
    getImageUrl(path) {
      if (!path) {
        console.warn('Image path is empty');
        return null;
      }
      // Ensure path starts with a slash and remove duplicate slashes
      const cleanPath = path.startsWith('/') ? path : `/${path}`;
      const url = `${this.baseUrl}${cleanPath}`.replace(/\/+/g, '/');
      console.log('Constructed image URL:', url); // Log the URL for debugging
      return url;
    },
    handlePhotoUpload(event) {
      const file = event.target.files[0];
      if (file && this.isValidFile(file)) {
        this.photoFile = file;
        this.previewPhoto = URL.createObjectURL(file);
        this.simulateUpload('photo');
      } else {
        alert('Invalid file type or size. Please upload a JPEG, JPG, or PNG file under 5MB.');
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
        alert('Invalid file type or size. Please upload a JPEG, JPG, or PNG file under 5MB.');
        this.$refs.eSignatureInput.value = '';
        this.previewESignature = null;
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
        this.studentPhoto = this.previewPhoto;
      }
    },
    confirmESignatureUpload() {
      this.showESignatureModal = false;
      if (this.eSignatureFile) {
        this.studentESignature = this.previewESignature;
      }
    },
    handleImageError(type) {
      console.error(`Failed to load ${type} image`);
      if (type === 'photo') {
        this.studentPhoto = null;
      } else if (type === 'eSignature') {
        this.studentESignature = null;
      }
    },
    // Get initials from student name for fallback avatar
    getInitials(name) {
      if (!name) return 'N/A';
      const names = name.trim().split(' ');
      const initials = names.length > 1
        ? names[0][0] + names[names.length - 1][0]
        : names[0].slice(0, 2);
      return initials.toUpperCase();
    },
  },
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
input {
  transition: all 0.2s ease;
}
input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 1px #3b82f6;
}
button:hover {
  transform: translateY(-1px);
}
.group {
  position: relative;
}
.group span {
  z-index: 10;
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
.bg-blue-100 {
  background-color: #e0f2fe; /* Light blue background */
}
.text-blue-600 {
  color: #1e40af; /* Darker blue for text */
}
</style>
```
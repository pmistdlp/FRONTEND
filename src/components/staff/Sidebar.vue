<!-- client/src/components/staff/Sidebar.vue -->
<template>
    <div class="w-20 md:w-64 bg-white flex flex-col shadow-2xl transition-all duration-300 border-r border-gray-200">
      <div class="p-4 md:p-6 bg-gradient-to-b from-gray-100 to-white flex items-center justify-center md:justify-start">
        <UserCircleIcon class="w-8 h-8 text-blue-500 md:mr-3" />
        <span class="hidden md:block text-xl font-extrabold tracking-tight text-gray-800">Staff</span>
      </div>
      <nav class="flex-1">
        <button @click="$emit('updateSection', 'courses')" 
                class="w-full p-4 md:px-6 md:py-4 flex flex-col md:flex-row items-center justify-center md:justify-start text-gray-600 hover:bg-gray-100 hover:text-blue-700 transition-all duration-300"
                :class="{ 'bg-blue-100 text-blue-700': activeSection === 'courses' }">
          <BookOpenIcon class="w-6 h-6 md:mr-3" />
          <span class="hidden md:block text-sm font-medium">Courses</span>
        </button>
        <button @click="$emit('updateSection', 'students')" 
                class="w-full p-4 md:px-6 md:py-4 flex flex-col md:flex-row items-center justify-center md:justify-start text-gray-600 hover:bg-gray-100 hover:text-blue-700 transition-all duration-300"
                :class="{ 'bg-blue-100 text-blue-700': activeSection === 'students' }">
          <UserGroupIcon class="w-6 h-6 md:mr-3" />
          <span class="hidden md:block text-sm font-medium">Students</span>
        </button>
      </nav>
      <button @click="$emit('logout')" 
              class="p-4 md:p-6 flex flex-col md:flex-row items-center justify-center md:justify-start text-gray-600 hover:bg-red-100 hover:text-red-700 transition-all duration-300">
        <ArrowLeftOnRectangleIcon class="w-6 h-6 md:mr-3" />
        <span class="hidden md:block text-sm font-medium">Logout</span>
      </button>
    </div>
  </template>
  
  <script>
  import { UserCircleIcon, BookOpenIcon, ArrowLeftOnRectangleIcon, UserGroupIcon } from '@heroicons/vue/24/solid';
  import { defineComponent } from 'vue';
  
  export default defineComponent({
    name: 'StaffSidebar',
    components: { UserCircleIcon, BookOpenIcon, ArrowLeftOnRectangleIcon, UserGroupIcon },
    props: {
      activeSection: {
        type: String,
        required: true,
      },
    },
  });
  </script>
  
  <style scoped>
  /* No additional styles needed; Tailwind handles transitions and animations */
  </style>
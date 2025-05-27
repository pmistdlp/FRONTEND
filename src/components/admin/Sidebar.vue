<template>
  <div class="w-20 md:w-64 bg-white flex flex-col shadow-lg transition-all duration-300 border-r border-gray-200">
    <div class="p-4 md:p-6 bg-gradient-to-b from-gray-100 to-white flex items-center justify-center md:justify-start border-b border-gray-200">
      <UserCircle2 class="w-8 h-8 text-blue-500 md:mr-3 transition-transform hover:scale-110" />
      <span class="hidden md:block text-xl font-extrabold tracking-tight text-gray-800">PMIST DLP</span>
    </div>

    <nav class="flex-1 overflow-y-hidden scrollbar-hide">
      <transition-group name="slide" tag="div">
        <button 
          v-for="section in sections" 
          :key="section.name" 
          @click="$emit('updateSection', section.name)" 
          class="w-full p-4 md:px-6 md:py-4 flex flex-col md:flex-row items-center justify-center md:justify-start text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-all duration-300 transform hover:scale-105"
          :class="{ 'bg-blue-100 text-blue-700 font-semibold': activeSection === section.name }"
          v-show="section.name !== 'questions' || selectedCourse"
        >
          <component :is="section.icon" class="w-6 h-6 md:mr-3 transition-transform hover:scale-110" />
          <span class="hidden md:block text-sm font-medium">{{ section.label }}</span>
        </button>
      </transition-group>
    </nav>

    <button 
      @click="$emit('logout')" 
      class="p-4 md:p-6 flex flex-col md:flex-row items-center justify-center md:justify-start text-gray-600 hover:bg-red-50 hover:text-red-500 transition-all duration-300 transform hover:scale-105"
    >
      <LogOut class="w-6 h-6 md:mr-3 transition-transform hover:scale-110" />
      <span class="hidden md:block text-sm font-medium">Logout</span>
    </button>
  </div>
</template>

<script>
import { 
  UserCircle2, 
  Users, 
  Book, 
  FileQuestion, 
  Users2, 
  Clock, 
  CheckCircle2, 
  LogOut,
  UserPlus
} from 'lucide-vue-next';
import { defineComponent } from 'vue';

export default defineComponent({
  components: { 
    UserCircle2, 
    Users, 
    Book, 
    FileQuestion, 
    Users2, 
    Clock, 
    CheckCircle2, 
    LogOut,
    UserPlus
  },
  props: ['activeSection', 'selectedCourse'],
  data() {
    return {
      sections: [
        { name: 'Faculty', label: 'Faculty', icon: 'Users' },
        { name: 'courses', label: 'Courses', icon: 'Book' },
        { name: 'questions', label: 'Questions', icon: 'FileQuestion' },
        { name: 'students', label: 'Learners', icon: 'Users2' },
        { name: 'history', label: 'History', icon: 'Clock' },
        { name: 'results', label: 'Results', icon: 'CheckCircle2' },
        { name: 'admin-enrollments', label: 'Registration', icon: 'UserPlus' }, // Updated label
      ],
    };
  },
});
</script>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.slide-enter-active, .slide-leave-active {
  transition: all 0.3s ease;
}
.slide-enter-from, .slide-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}
.slide-move {
  transition: transform 0.3s ease;
}
</style>
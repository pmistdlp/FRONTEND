<template>
  <div class="space-y-6 p-6 bg-gray-50 text-gray-800 min-h-screen">
    <h2 class="text-2xl font-semibold text-gray-900 hover:text-indigo-600 transition-colors duration-200">Modification History</h2>

    <!-- Course History -->
    <section class="bg-white p-5 rounded-lg shadow-lg border border-gray-100">
      <h3 class="text-lg font-medium text-indigo-600 mb-4">Course History</h3>
      <div class="overflow-x-auto">
        <table class="w-full text-sm border-collapse">
          <thead>
            <tr class="bg-indigo-50 text-indigo-800 uppercase text-xs font-semibold">
              <th class="py-3 px-4 text-left">Course</th>
              <th class="py-3 px-4 text-left">Action</th>
              <th class="py-3 px-4 text-left">Modified By</th>
              <th class="py-3 px-4 text-left">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="h in courseHistory" :key="h.id" class="border-b border-gray-100 hover:bg-indigo-50 transition-colors duration-150">
              <td class="py-3 px-4 text-gray-700">{{ h.courseName }}</td>
              <td class="py-3 px-4 text-gray-700">Question {{ h.action }}</td>
              <td class="py-3 px-4 text-gray-700">{{ h.userType === 'admin' ? h.adminName : h.staffName }}</td>
              <td class="py-3 px-4 text-gray-600 text-xs">{{ formatTimestamp(h.timestamp) }}</td>
            </tr>
            <tr v-if="courseHistory.length === 0" class="text-center text-gray-500">
              <td colspan="4" class="py-4">No course history available</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Student History -->
    <section class="bg-white p-5 rounded-lg shadow-lg border border-gray-100">
      <h3 class="text-lg font-medium text-indigo-600 mb-4">Student History</h3>
      <div class="overflow-x-auto">
        <table class="w-full text-sm border-collapse">
          <thead>
            <tr class="bg-indigo-50 text-indigo-800 uppercase text-xs font-semibold">
              <th class="py-3 px-4 text-left">Student</th>
              <th class="py-3 px-4 text-left">Action</th>
              <th class="py-3 px-4 text-left">Modified By</th>
              <th class="py-3 px-4 text-left">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="h in studentHistory" :key="h.id" class="border-b border-gray-100 hover:bg-indigo-50 transition-colors duration-150">
              <td class="py-3 px-4 text-gray-700">{{ h.studentName }}</td>
              <td class="py-3 px-4 text-gray-700">{{ h.action }}</td>
              <td class="py-3 px-4 text-gray-700">{{ h.userType === 'admin' ? h.adminName : h.staffName }}</td>
              <td class="py-3 px-4 text-gray-600 text-xs">{{ formatTimestamp(h.timestamp) }}</td>
            </tr>
            <tr v-if="studentHistory.length === 0" class="text-center text-gray-500">
              <td colspan="4" class="py-4">No student history available</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'History',
  props: {
    user: {
      type: Object,
      required: true,
      default: () => ({}),
    },
    courseHistory: {
      type: Array,
      default: () => [],
    },
    studentHistory: {
      type: Array,
      default: () => [],
    },
  },
  methods: {
    formatTimestamp(timestamp) {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    },
  },
});
</script>

<style scoped>
/* Table Styling */
table {
  width: 100%;
  border-spacing: 0;
}

th, td {
  padding: 0.75rem 1rem; /* Consistent padding */
}

thead tr {
  background-color: #eef2ff; /* Soft indigo background */
  border-bottom: 2px solid #e5e7eb; /* Subtle border */
}

tbody tr {
  transition: background-color 0.2s ease;
}

tbody tr:hover {
  background-color: #f5f3ff; /* Light hover effect */
}

/* Container Styling */
section {
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); /* Softer shadow */
  border-radius: 0.5rem; /* Rounded corners */
}

/* Typography */
h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

h3 {
  font-size: 1.125rem;
  font-weight: 500;
}

/* Responsive Adjustments */
@media (max-width: 640px) {
  th, td {
    padding: 0.5rem;
    font-size: 0.875rem;
  }
  h2 {
    font-size: 1.25rem;
  }
  h3 {
    font-size: 1rem;
  }
}
</style>
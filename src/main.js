// main.js
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import axios from 'axios';
import apiConfig from './config/apiConfig';

const app = createApp(App);

// Axios configuration
function initializeAxios() {
  try {
    const baseURL = apiConfig.getBaseURL(); // Synchronous call
    console.log('Axios baseURL set to:', baseURL);

    // Set Axios defaults
    axios.defaults.baseURL = baseURL;
    axios.defaults.timeout = 30000; // 30 seconds timeout
  } catch (error) {
    console.error('Failed to resolve baseURL:', error);
    throw new Error('Axios initialization failed');
  }

  // Add Axios retry interceptor for actual API calls
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const config = error.config;

      // Only retry for specific errors (e.g., timeout or network errors, exclude 404)
      if (!config || !config.retry) {
        config.retry = 3; // Max 3 retries
        config.retryDelay = 1000; // 1 second delay between retries
      }

      if (config.retry > 0 && (error.code === 'ECONNABORTED' || !error.response)) {
        console.warn(`Retrying request to ${config.url}. Attempts left: ${config.retry}`);
        config.retry -= 1;
        await new Promise((resolve) => setTimeout(resolve, config.retryDelay));
        return axios(config);
      }

      console.error('Axios request failed:', error.message, error.config?.url);
      return Promise.reject(error);
    }
  );

  app.use(router);
  app.mount('#app');
}

initializeAxios();
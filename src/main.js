// main.js
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import axios from 'axios';
import apiConfig from './config/apiConfig';

const app = createApp(App);

async function initializeAxios() {
  try {
    const baseURL = await apiConfig.getBaseURL();
    console.log('Axios baseURL set to:', baseURL);
    axios.defaults.baseURL = baseURL;
  } catch (error) {
    console.error('Failed to resolve baseURL:', error);
    throw new Error('Axios initialization failed');
  }

  app.use(router);
  app.mount('#app');
}

initializeAxios();
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import axios from 'axios';
import apiConfig from './config/apiConfig';

const Vue = { createApp };
console.log('Vue loaded with createApp:', Vue.createApp);
if (!Vue.createApp || typeof Vue.createApp !== 'function') {
  console.error('Vue.createApp is not properly initialized or is undefined');
  throw new Error('Vue initialization failed');
}
if (Vue.config) {
  Vue.config.productionTip = false;
} else {
  console.warn('Vue.config is not available in this setup');
}
const app = createApp(App);
async function initializeAxios() {
  try {
    const baseURL = await apiConfig.getBaseURL();
    console.log('Axios baseURL set to:', baseURL);
    axios.defaults.baseURL = baseURL;
  } catch (error) {
    console.warn('Failed to resolve baseURL, falling back to server URL:', error);
    axios.defaults.baseURL = 'https://mooc-backend-1.onrender.com';
  }
  app.use(router);
  app.mount('#app');
}
initializeAxios();
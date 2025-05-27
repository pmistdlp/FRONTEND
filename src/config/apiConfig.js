const getBaseURL = async () => {
  const SERVER_URL = 'https://mooc-backend-1wg6.onrender.com';
  const LOCAL_URL = 'http://localhost:3000';

  console.log('NODE_ENV:', process.env.NODE_ENV); // Debug environment

  // In production, use the server URL
  if (process.env.NODE_ENV === 'production') {
    console.log('Production mode, using:', SERVER_URL);
    return SERVER_URL;
  }

  // In development, default to local URL
  console.log('Development mode, using:', LOCAL_URL);
  return LOCAL_URL;
};

const apiConfig = {
  baseURL: 'http://localhost:3000', // Fallback, overridden by getBaseURL
  getBaseURL,
};

export default apiConfig;

/* const getBaseURL = async () => {
  return 'https://mooc-backend-1.onrender.com';
};

const apiConfig = {
  getBaseURL,
};

export default apiConfig; */
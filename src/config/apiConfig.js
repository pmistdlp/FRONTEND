// apiConfig.js
const getBaseURL = () => {
  const SERVER_URL = 'https://backend-a5iy.onrender.com';
  const LOCAL_URL = 'http://localhost:3000';

  if (process.env.NODE_ENV === 'production') {
    console.log('Production mode, using:', SERVER_URL);
    return SERVER_URL;
  }

  console.log('Development mode, using:', LOCAL_URL);
  return LOCAL_URL;
};

const apiConfig = {
  getBaseURL,
};

export default apiConfig;
module.exports = {
  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/ping': {
        target: 'https://backend-a5iy.onrender.com',
        changeOrigin: true,
      },
    },
  },
};
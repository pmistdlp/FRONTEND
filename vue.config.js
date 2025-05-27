module.exports = {
  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/ping': {
        target: 'https://mooc-backend-1wg6.onrender.com',
        changeOrigin: true,
      },
    },
  },
};
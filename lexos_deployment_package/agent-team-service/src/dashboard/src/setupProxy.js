const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000',
      changeOrigin: true,
      secure: process.env.NODE_ENV === 'production',
      pathRewrite: {
        '^/api': '',
      },
    })
  );

  app.use(
    '/ws',
    createProxyMiddleware({
      target: process.env.REACT_APP_API_BASE_URL?.replace('http', 'ws') || 'ws://localhost:8000',
      ws: true,
      changeOrigin: true,
      secure: process.env.NODE_ENV === 'production',
    })
  );
}; 
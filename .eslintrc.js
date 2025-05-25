module.exports = {
    extends: ['react-app', 'react-app/jest'],
    rules: {
      // Let React handle boolean ARIA attributes without type warnings
      'react/aria-proptypes': 'off',
      'react/jsx-boolean-value': 'off',
      // Let useNavigate pass in react-router-dom without tripping types
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-restricted-imports': [
        'error',
        {
          paths: [{
            name: 'react-router-dom',
            importNames: ['useHistory'], // block useHistory in favor of useNavigate
            message: 'useNavigate is preferred in v6+'
          }]
        }
      ]
    }
  };
  
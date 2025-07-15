module.exports = {
  extends: ['react-app', 'react-app/jest'],
  rules: {
    // می‌توانید قوانین ESLint اضافی را اینجا اضافه کنید
  },
  globals: {
    // متغیرهای گلوبالی که ESLint نباید برای آنها خطا بدهد
    __firebase_config: 'readonly',
    __app_id: 'readonly',
    __initial_auth_token: 'readonly',
  },
};

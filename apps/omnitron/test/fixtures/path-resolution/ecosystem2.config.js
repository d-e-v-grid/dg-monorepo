module.exports = {
  /**
   * Application configuration section
   * http://omnitron.keymetrics.io/docs/usage/application-declaration/
   */
  apps: [
    {
      name: 'test',
      script: './echo.js',
      out_file: 'echo-out.log',
      error_file: 'echo-err.log',
      pid_file: 'echo-pid.log',
    },
  ],
};

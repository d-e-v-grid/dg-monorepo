module.exports = {
  apps: [
    {
      cmd: "bun -e 'setTimeout(function() { }, 100000); console.log(process.env.TEST)'",
      log: 'test-conf.log',
      merge_logs: true,
      env: {
        TEST: 'test_val',
      },
    },
  ],
};

[
  {
    name: 'echo',
    script: ['.', '/', 'e', 'cho.js'].join(''),
  },
  {
    name: 'child',
    script: './child.js',
    instances: '4',
    error_file: './child-err.log',
    out_file: './child-out.log',
  },
  {
    name: 'api-2',
    script: './server.js',
  },
];

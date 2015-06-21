'use strict';

var path = require('path');

module.exports = function (grunt) {
  grunt.initConfig({
    // Create browser versions of our client-side modules
    browserify: {
      options: {
        debug: true
      },
      dev: {
        src: ['client/scheduler.js'],
        dest: 'content/scripts/bundle.js'
      }
    },
    // Test modules
    mochaTest: {
      all: {
        options: {
          reporter: 'spec',
          quiet: false
        },
        src: ['client/**/*.spec.js', 'server/**/*.spec.js']
      }
    },
    // Code formatting enforcement
    jscs: {
      all: [
        './*.js',
        'client/**/*.js',
        '!client/**/*.spec.js',
        'server/**/*.js',
        '!server/**/*.spec.js'
      ],
      options: {
        config: '.jscsrc',
        esnext: true,
        verbose: true
      }
    },
    // Code linting
    jshint: {
      files: ['' +
        './*.js',
        'client/**/*.js',
        'server/**/*.js'
      ],
      options: {
        jshintrc: true
      }
    },
    // Launch the node server
    express: {
      server: {
        server:       path.resolve(__dirname, 'server.js'),
        bases:        path.resolve(__dirname, 'content'),
        livereload:   true,
        serverreload: true,
        showStack:    true
      }
    }
  });

  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-express');
  grunt.loadNpmTasks('grunt-jscs');
  grunt.loadNpmTasks('grunt-mocha-test');

  grunt.registerTask('test', [
    'jshint',
    'jscs:all',
    'mochaTest:all'
  ]);

  grunt.registerTask('build', [
    'test',
    'browserify',
    'copy:client'
  ]);
};

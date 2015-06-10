'use strict';

module.exports = function (grunt) {
  grunt.initConfig({
    browserify: {
      options: {
        debug: true
      },
      dev: {
        src: ['client/scheduler.js'],
        dest: 'build/bundle.js'
      }
    },
    mochaTest: {
      all: {
        options: {
          reporter: 'spec',
          quiet: false
        },
        src: ['client/**.spec.js', 'server/**.spec.js']
      }
    },
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
    jshint: {
      files: ['' +
        './*.js',
        'client/**/*.js',
        'server/**/*.js'
      ],
      options: {
        jshintrc: true
      }
    }
  });

  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-jscs');
  grunt.loadNpmTasks('grunt-mocha-test');

  grunt.registerTask('test', [
    'jshint',
    'jscs:all',
    'mochaTest:all'
  ]);

  grunt.registerTask('build', [
    'test',
    'browserify'
  ]);
};

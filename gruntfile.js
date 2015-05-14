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
        src: ['client/**.spec.js']
      }
    }
  });

  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-mocha-test');

  grunt.registerTask('test', [
    'mochaTest:all'
  ]);
};

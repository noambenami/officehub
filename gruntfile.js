module.exports = function (grunt) {

  grunt.initConfig({
    karma: {
      all: {
        configFile: 'karma.conf.js'
      }
    }
  });

  grunt.loadNpmTasks('grunt-karma');

};

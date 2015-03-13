'use strict';
var packagejson = require('./package.json');

module.exports = function (grunt) {
 
  // Configuration

  grunt.initConfig({
    pkg: packagejson,
    jshint: {
      build: [
        'app/Presidents.js'
      ]
    },
    clean: {
      deploy: ['dist/']
    },    
    copy: {
      dev: {
        files: [
          {expand: true, cwd: 'bower_components/jquery/dist/', src: 'jquery.min.js', dest: 'lib/'},
          {expand: true, cwd: 'bower_components/qtip2/basic/', src: 'jquery.qtip.min.js', dest: 'lib/'},
          {expand: true, cwd: 'bower_components/qtip2/basic/', src: 'jquery.qtip.min.css', dest: 'lib/'},
          {expand: true, cwd: 'bower_components/leaflet/dist/', src: 'leaflet.js', dest: 'lib/'},
          {expand: true, cwd: 'bower_components/leaflet/dist/', src: 'leaflet.css', dest: 'lib/'},
          {expand: true, cwd: 'bower_components/esri-leaflet/dist/', src: 'esri-leaflet.js', dest: 'lib/'},
          {expand: true, cwd: 'bower_components/unslider/src/', src: 'unslider.min.js', dest: 'lib/'}
        ]
      },
      dist: {
        files: [
          {expand: true, cwd: '', src: 'css/*.*', dest: 'dist/'},
          {expand: true, cwd: '', src: 'lib/*.*', dest: 'dist/'},
          {expand: true, cwd: '', src: 'data/*.csv', dest: 'dist/'},
          {expand: true, cwd: '', src: 'resources/**', dest: 'dist/'}
        ]
      }
    },
    uglify: {
      options: {mangle: false},
      my_target: {
        files: {
          'dist/app.min.js':['app/*.js', 'app/utils/*.js']
        }
      }
    },
    processhtml: {
      build: {
        files: {
          'dist/index.html': ['index.html']
        }    
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-processhtml');
  
  grunt.registerTask('default', ['jshint']);
  grunt.registerTask('build', ['clean:deploy', 'processhtml', 'uglify', 'copy:dist']);
  grunt.registerTask('update-dependencies', ['copy:dev']);  
  
};
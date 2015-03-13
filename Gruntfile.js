'use strict';
var packagejson = require('./package.json');

var config = {
  pkg: packagejson,
  lib: 'lib',
  dist: 'dist'
}
 
module.exports = function (grunt) {
 
  // Configuration

  grunt.initConfig({
    pkg: packagejson,
    jshint: {
      build: [
        'app/Presidents.js'
      ]
    },
    copy: {
      main: {
        files: [
          {expand: true, cwd: 'bower_components/jquery/dist/', src: 'jquery.min.js', dest: 'lib/'},
          {expand: true, cwd: 'bower_components/qtip2/basic/', src: 'jquery.qtip.min.js', dest: 'lib/'},
          {expand: true, cwd: 'bower_components/qtip2/basic/', src: 'jquery.qtip.min.css', dest: 'lib/'},
          {expand: true, cwd: 'bower_components/leaflet/dist/', src: 'leaflet.js', dest: 'lib/'},
          {expand: true, cwd: 'bower_components/leaflet/dist/', src: 'leaflet.css', dest: 'lib/'},
          {expand: true, cwd: 'bower_components/esri-leaflet/dist/', src: 'esri-leaflet.js', dest: 'lib/'},
          {expand: true, cwd: 'bower_components/unslider/src/', src: 'unslider.min.js', dest: 'lib/'}
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

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-processhtml');
  
  grunt.registerTask('default', 
    [
      'jshint', 'copy'
    ]
  );

  grunt.registerTask('build', [
    'processhtml', 'uglify'
  ]);  
  
};
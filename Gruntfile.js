/*!
 * QuantumUI's Gruntfile
 * http://angularui.net
 * Copyright 2014-2015 Mehmet Ötkün, AngularUI.
 */

module.exports = function (grunt) {
    'use strict';

    // Force use of Unix newlines
    grunt.util.linefeed = '\n';

    grunt.initConfig({

        // Metadata.
        pkg: grunt.file.readJSON('package.json'),
        bower_conf: grunt.file.exists('.bowerrc') ? grunt.file.readJSON('.bowerrc') : { directory: 'bower_components' },
        banner: '/*!\n' +
                ' * QuantumUI Free v<%= pkg.version %> (<%= pkg.homepage %>)\n' +
                ' * Copyright 2014-<%= grunt.template.today("yyyy") %> <%= pkg.author %>\n' +
                ' */\n',

        // Task configuration.
        clean: {
            dist: ['dist']
        },

        jshint: {
            options: {
                jshintrc: 'js/.jshintrc'
            },
            src: {
                src: 'src/*.js'
            },
            assets: {
                src: 'doc/js/app.js'
            }
        },

        jscs: {
            options: {
                config: 'js/.jscsrc'
            },
            grunt: {
                options: {
                    requireCamelCaseOrUpperCaseIdentifiers: null
                },
                src: 'Gruntfile.js'
            },
            src: {
                src: '<%= jshint.src.src %>'
            },
            assets: {
                options: {
                    requireCamelCaseOrUpperCaseIdentifiers: null
                },
                src: 'doc/js/app.js'
            }
        },

        concat: {
            options: {
                banner: '<%= banner %>',
                stripBanners: false
            },
            dist: {
                src: [
                  'src/core/*.js',
                  'src/services/*.js',
                  'src/components/*.js',
                  'src/ngquantum.js',
                ],
                dest: 'dist/js/<%= pkg.name %>.js'
            },
            nojq: {
                src: [
                  'src/nojq/*.js',
                  'src/core/*.js',
                  'src/services/*.js',
                  'src/components/*.js',
                  'src/ngquantum.js',
                ],
                dest: 'dist/js/<%= pkg.name %>-nojq.js'
            },
            all: {
                src: [
                  'src/nojq/*.js',
                  'src/core/*.js',
                  'src/services/*.js',
                  'src/components/*.js',
                  'src/pageable/*.js',
                  'src/pageable.js',
                  'src/ngquantum-all.js',
                ],
                dest: 'dist/js/<%= pkg.name %>-all.js'
            }
        },

        uglify: {
            options: {
                preserveComments: 'some',
                sourceMap: true,
                sourceMapName: 'dist/js/<%= pkg.name %>.min.js.map'
            },
            dist: {
                src: '<%= concat.dist.dest %>',
                dest: 'dist/js/<%= pkg.name %>.min.js'
            },
            nojq: {
                options: {
                    sourceMapName: 'dist/js/<%= pkg.name %>-nojq.min.js.map'
                },
                src: '<%= concat.nojq.dest %>',
                dest: 'dist/js/<%= pkg.name %>-nojq.min.js'
            },
            all: {
                options: {
                    sourceMapName: 'dist/js/<%= pkg.name %>-all.min.js.map'
                },
                src: '<%= concat.all.dest %>',
                dest: 'dist/js/<%= pkg.name %>-all.min.js'
            }
        },

        less: {
            compileCore: {
                options: {
                    strictMath: true,
                    sourceMap: true,
                    outputSourceFiles: true,
                    sourceMapURL: '<%= pkg.name %>.css.map',
                    sourceMapFilename: 'dist/css/<%= pkg.name %>.css.map'
                },
                files: {
                    'dist/css/<%= pkg.name %>.css': 'less/<%= pkg.name %>.less'
                }
            },
            compileBootstrap: {
                options: {
                    strictMath: true,
                    sourceMap: true,
                    outputSourceFiles: true,
                    sourceMapURL: 'bootstrap-<%= pkg.name %>.css.map',
                    sourceMapFilename: 'dist/css/bootstrap-<%= pkg.name %>.css.map'
                },
                files: {
                    'dist/css/<%= pkg.name %>.css': 'less/bootstrap-<%= pkg.name %>.less'
                }
            }
        },

        autoprefixer: {
            options: {
                browsers: [
                  'Android >= 4',
                  'Chrome >= 20',
                  'Firefox >= 24', // Firefox 24 is the latest ESR
                  'Explorer >= 9',
                  'iOS >= 6',
                  'Opera >= 16',
                  'Safari >= 6'
                ]
            },
            core: {
                options: {
                    map: true
                },
                src: ['dist/css/<%= pkg.name %>.css', 'dist/css/bootstrap-<%= pkg.name %>.css']
            }
        },

        csslint: {
            options: {
                csslintrc: 'less/.csslintrc',
                'overqualified-elements': false
            },
            src: [
              'dist/css/<%= pkg.name %>.css'
            ],
            assets: {
            //    options: {
            //        ids: false,
            //        'overqualified-elements': false
            //    },
            //    src: ['docs/assets/css/docs.css', 'docs/assets/css/demo.css']
            }
        },

        cssmin: {
            options: {
                keepSpecialComments: '*',
                noAdvanced: true
            },
            core: {
                files: {
                    'dist/css/<%= pkg.name %>.min.css': 'dist/css/<%= pkg.name %>.css',
                    'dist/css/bootstrap-<%= pkg.name %>.min.css': 'dist/css/bootstrap-<%= pkg.name %>.css'
                }
            }
        },

        usebanner: {
            dist: {
                options: {
                    position: 'top',
                    banner: '<%= banner %>'
                },
                files: {
                    src: [
                      'dist/css/addon/*.css',
                      'dist/css/<%= pkg.name %>*.css',
                      'dist/js/<%= pkg.name %>*.js',
                      'dist/js/<%= pkg.name %>*.map'
                    ]
                }
            }
        },

        csscomb: {
            options: {
                config: 'less/.csscomb.json'
            },
            dist: {
                files: {
                    'dist/css/<%= pkg.name %>.css': 'dist/css/<%= pkg.name %>.css',
                    'dist/css/bootstrap-<%= pkg.name %>.min.css': 'dist/css/bootstrap-<%= pkg.name %>.css'
                }
            },
            assets: {
                //files: {
                //    'docs/assets/css/docs.css': 'docs/assets/css/docs.css',
                //    'docs/assets/css/demo.css': 'docs/assets/css/demo.css'
                //}
            }
        },

        copy: {
            dist: {
                expand: true,
                src: [
                  'images/**'
                ],
                dest: 'dist/'
            },
            //distTemplate: {
            //    src: 'doc/template.html',
            //    dest: 'dist/index.html'
            //},
            distVendorJS: {
                expand: true,
                flatten: true,
                cwd: './bower_components',
                src: [
                  'moment/min/moment.min.js',
                  'angular/angular.min.js',
                  'angular/angular.min.js.map',
                  'angular-animate/angular-animate.min.js',
                  'angular-animate/angular-animate.min.js.map',
                  'angular-sanitize/angular-sanitize.min.js',
                  'angular-sanitize/angular-sanitize.min.js.map',
                ],
                dest: 'dist/js/vendor/'
            },
            distVendorCSS: {
                expand: true,
                flatten: true,
                cwd: '<%= bower_conf.directory %>',
                src: [
                  'bootstrap/dist/css/bootstrap.min.css'
                ],
                dest: 'dist/css/vendor/'
            },
            distAddonCSS: {
                expand: true,
                flatten: true,
                cwd: './styles',
                src: [
                  'effect-light.min.css'
                ],
                dest: 'dist/css/addon/'
            }
        },

        connect: {
            options: {
                port: 9091,
                livereload: 37930,
                hostname: 'localhost',
                base: '.'
            },
            livereload: {
                options: {
                    open: true
                }
            }
        },
        comments: {
            js: {
                options: {
                    singleline: true,
                    multiline: false
                },
                src: ['src/**/*.js']
            }
        },
        watch: {
            less: {
                files: 'less/**/*.less',
                tasks: ['less', 'autoprefixer']
            },
            livereload: {
                options: {
                    livereload: '<%= connect.options.livereload %>'
                },
                files: ['{,*/}*.html', '{dist}/**/css/{,*/}*.css', '{dist}/**/js/{,*/}*.js']
            }
        }
    });

    // These plugins provide necessary tasks.
    require('load-grunt-tasks')(grunt, { scope: 'devDependencies' });
    require('time-grunt')(grunt);

    // Test task.
    grunt.registerTask('test', ['csslint', 'jshint', 'jscs']);

    grunt.registerTask('dist', function (target) {
        if (target === 'js') {
            // JS distribution task.
            return grunt.task.run(['comments:js', 'concat', 'uglify']);
        }
        if (target === 'css') {
            // CSS distribution task.
            return grunt.task.run(['less', 'autoprefixer', 'csscomb', 'cssmin']);
        }

        if (target === 'docs') {
            // Docs distribution task.
            return grunt.task.run(['copy:distVendorJS']);
        }
        if (target === 'copy') {
            // Copy files to dist.
            return grunt.task.run(['copy:dist', 'copy:distAddonCSS']);
        }
        if (target === 'copy-vendor') {
            // Copy files to dist.
            return grunt.task.run(['copy:distVendorJS', 'copy:distVendorCSS']);
        }
        // Full distribution task.
        grunt.task.run(['clean', 'dist:css', 'dist:copy', 'dist:js', 'usebanner']);
    });


    // Default task.
    grunt.registerTask('default', ['test', 'dist']);

    // Run server, run...
    grunt.registerTask('server', ['less', 'autoprefixer', 'connect:livereload', 'watch']);
};
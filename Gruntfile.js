/*global require, module*/
module.exports = function(grunt) {

    "use strict";

    require("matchdep").filterDev("grunt-*").forEach(grunt.loadNpmTasks);

    // Project configuration.
    grunt.initConfig({
        // Metadata.
        pkg: grunt.file.readJSON("package.json"),
        banner: "/*! <%= pkg.info.fullName %> - v<%= pkg.version %> - " +
            "<%= grunt.template.today('yyyy-mm-dd') %>\n" +
            "* Copyright (c) <%= grunt.template.today('yyyy') %> <%= pkg.author.name %>;" +
            " Licensed <%= _.pluck(pkg.licenses, 'type').join(', ') %> */\n",
        buildVersion: grunt.template.today("yyyymmddHHMM"),
        // Task configuration.
        bumpup: {
            files: ["package.json","bower.json"],
            options: {
                normalize: true
            }
        },
        clean: {
            release: ["target"],
            all: ["libs","node_modules","target"]
        },
        copy: {
            release: {
                files: [
                    {
                        expand: true, flatten: false,
                        src: [
                            "*.html",
                            "fav*.*",
                            "assets/**/*",
                            "js/**/*",
                            "libs/**/*",
                            "css/**/*"
                        ],
                        dest: "target/release/"
                    }
                ]
            },
            push: {
                files: [
                    {
                        expand: true,
                        flatten: false,
                        cwd: "target/release/",
                        src: [
                            "assets/**.*",
                            "**/*.min.*",
                            "*.html"
                        ],
                        dest: "target/release.git/"
                    }
                ]
            },
            pushConfig: {
                files: [
                    {
                        expand: true, flatten: false,
                        src: [ "config.xml" ],
                        dest: "target/release.git/"
                    }
                ],
                options: {
                    process: function(content, srcpath) {
                        grunt.log.write( "Modifying " + srcpath + "\n" );
                        return content
                            .replace(/%version%/g, grunt.config.get("pkg.version") )
                            .replace(/%buildVersion%/g, grunt.config.get("buildVersion") )
                            .replace(/%name%/g, grunt.config.get("pkg.name") ) //jshint ignore:line
                            .replace(/%fullName%/g, grunt.config.get("pkg.info.fullName") ) //jshint ignore:line
                            .replace(/%description%/g, grunt.config.get("pkg.info.description") ) //jshint ignore:line
                            .replace(/%safeName%/g, grunt.config.get("pkg.info.safeName") ) //jshint ignore:line
                            .replace(/%author%/g, grunt.config.get("pkg.author.name") )
                            .replace(/%email%/g, grunt.config.get("pkg.author.email") )
                        ;
                    }
                }
            }
        },
        gitadd: {
            release: {
                options: {
                    all: true,
                    cwd: "target/release.git/",
                    force: false
                },
                files: {
                    src: ["."]
                }
            },
            source: {
                options: {
                    all: true,
                    force: false
                },
                files: {
                    src:["."]
                }
            }
        },
        gitclone: {
            release: {
                options: {
                    cwd: "target/",
                    branch: "release",
                    depth: 1,
                    repository: "<%= pkg.repository.url %>",
                    directory: "release.git"
                }
            }
        },
        gitcheckout: {
            source: {
                options: {
                    branch: "master"
                }
            }
        },
        gitcommit: {
            release: {
                options: {
                    cwd: "target/release.git/",
                    message: "Releasing v<%= pkg.version %> build <%= buildVersion %>",
                    allowEmpty: true //In case of no changes since last dev build...
                },
                files: {
                    src: ["."]
                }
            },
            source: {
                options: {
                    message: "Version bump"
                },
                files: {
                    src:["."]
                }
            }
        },
        gitpush: {
            release: {
                options: {
                    cwd: "target/release.git/",
                    remote: "origin",
                    branch: "release",
                    tags: true
                }
            }
        },
        gitstash: {
            source: {
                options: {
                    command: "save"
                }
            }
        },
        gittag: {
            release: {
                options: {
                    cwd: "target/release.git/",
                    tag: "v<%= pkg.version %>"
                }
            },
            source: {
                options: {
                    tag: "v<%= pkg.version %>-src"
                }
            },
            dev: {
                options: {
                    cwd: "target/release.git/",
                    tag: "v<%= pkg.version %>-<%= buildVersion %>"
                }
            }
        },
        http: {
            options: {
                url: "https://build.phonegap.com/api/v1/apps/<%= pkg.info.id %>",
                method: "PUT",
                headers: {
                    "Authorization": "Basic " +
                        "<%= grunt.file.read( process.env[\"HOME\"] + \"/.phonegap.auth\") %>", //jshint ignore:line
                    "Accept": "*/*"
                }
            },
            kickPhonegap: {
                options: {
                    form: {
                        data: {
                            debug: false,
                            pull: true
                        }
                    }
                },
                dest: "target/release/phonegap.response.json"
            },
            kickPhonegapDev: {
                options: {
                    form: {
                        data: {
                            debug: true,
                            pull: true
                        }
                    }
                },
                dest: "target/release/phonegapdev.response.json"
            }
        },
        "http-server": {
            dev: {
                root: "./",
                port: 8282,
                host: "0.0.0.0",
                showDir: true,
                autoIndex: true,
                ext: "html",
                runInBackground: true
            }
        },
        jshint: {
            gruntfile: {
                src: "Gruntfile.js"
            },
            source: {
                src: ["js/**/*.js", "test/**/*.js"]
            }
        },
        mkdir: {
            target: {
                options: {
                    create: ["target"]
                }
            }
        },
        open: {
            dev: {
                path: "http://127.0.0.1:8282/"
            }
        },
        sass: {
            options: {
                loadPath: [
                    "libs"
                ],
            },
            std: {
                options: {
                    style: "compressed"
                },
                files: [{
                    expand: true,
                    flatten: true,
                    cwd: "<%= pkg.files.sass.cwd %>",
                    src: ["<%= pkg.files.sass.src %>"],
                    dest: "<%= pkg.files.sass.dest %>",
                    ext: ".css"
                }]
            },
            dev: {
                options: {
                    style: "expanded",
                    lineNumbers: true,
                    debugInfo: true
                },
                files: [{
                    expand: true,
                    flatten: true,
                    cwd: "<%= pkg.files.sass.cwd %>",
                    src: ["<%= pkg.files.sass.src %>"],
                    dest: "<%= pkg.files.sass.dest %>",
                    ext: ".css"
                }]
            }
        },
        useminPrepare: {
            options: {
                dest: "target/release/",
                staging: "target/staging/"
            },
            html: ["target/release/index.html"]
        },
        usemin: {
            html: ["target/release/index.html"]
        },
        watch: {
            sass: {
                // We watch and compile sass files as normal but don"t live reload here
                files: ["<%= pkg.files.watch.sass.files %>"],
                tasks: ["<%= pkg.files.watch.sass.tasks %>"]
            },
            livereload: {
                // Here we watch the files the sass task will compile to
                // These files are sent to the live reload server after sass compiles to them
                options: { livereload: true },
                files: ["<%= pkg.files.watch.livereload.files %>"]
            }
        }
    });

    // Default task.
    grunt.registerTask("default", ["sass:dev"]);
    grunt.registerTask("host", ["sass:dev","http-server:dev","open:dev","watch"]);
    grunt.registerTask(
        "install",
        [
            "clean:release",
            "jshint",
            "sass:std",
            "mkdir",
            "copy:release",
            "useminPrepare",
            "concat:generated",
            "cssmin:generated",
            "uglify:generated",
            "usemin"
        ]
    );
    grunt.registerTask("release",
     "My custom release task, can be run in stages [prep|dev|live], prep must be used " +
     "before live!\n" +
     "'dev' will commit and push to release branch without confirmation.\n" +
     "'prep' will stash anything on current branch and checkout master branch.",
      function (type) {
        var isDev = type === "dev";
        if (!isDev) {
            grunt.task.run("releaseclean");
        } else {
            type = "prep";
        }
        type = type ? type : "prep"; // Default release type
        grunt.task.run("release" + type);
        if (isDev) {
            grunt.task.run("releasedev");
        }
    });
    grunt.registerTask(
        "releaselive",
        [
            "gittag:source",
            "gittag:release",
            "gitpush:release",
            "bumpup",
            "gitadd:source",
            "gitcommit:source",
            "http:kickPhonegap"
        ]
    );
    grunt.registerTask(
        "releasedev",
        [
            "gittag:dev",
            "gitpush:release",
            "http:kickPhonegapDev"
        ]
    );
    grunt.registerTask(
        "releaseprep",
        [
            "install",
            "gitclone:release",
            "copy:push",
            "copy:pushConfig",
            "gitadd:release",
            "gitcommit:release"
        ]
    );
    grunt.registerTask(
        "releaseclean",
        [
            "gitstash",
            "gitcheckout"
        ]
    );

};

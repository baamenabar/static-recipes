'use strict';

var gulp = require('gulp');
var argv = require('yargs').argv;
var ssg = require('gulp-ssg');
var rename = require('gulp-rename');
var data = require('gulp-data');
var matter = require('gray-matter');
var textile = require('gulp-textile');
var wrap = require('gulp-wrap');
var handlebars = require('handlebars');
var partialLoader = require('partials-loader');
var responsive = require('gulp-responsive-images');
var imagemin = require('gulp-imagemin');
var imageminMozjpeg = require('imagemin-mozjpeg');
var del = require('del');
var fs = require('fs');

gulp.task('html', function(done) {
    partialLoader.handlebars({ template_engine_reference: handlebars,
                            template_root_directories: './src/templates',
                            partials_directory_names: 'partials',
                            template_extensions: 'hbr',
                            delimiter_symbol: '/'
                        });
    var uncompiledArticleTemplate = handlebars.compile(fs.readFileSync('src/templates/article.hbr', 'utf8'));
    var uncompiledListTemplate = handlebars.compile(fs.readFileSync('src/templates/list.hbr', 'utf8'));
    return gulp.src('src/content/*.textile')

        // Extract YAML front-matter using gulp-data
        .pipe(data(function(file) {
            var m = matter(String(file.contents));
            file.contents = new Buffer(m.content);
            return m.data;
        }))

        // textile -> HTML
        .pipe(textile())

        // Rename to .html
        .pipe(rename({ extname: '.html' }))

        // Run through gulp-ssg
        .pipe(ssg())

        //*
        .pipe(data(function(file) {
            if(argv.verbose)console.log('\n---- file data:',file.data,'\n\n')
            var dataHolder = {file:file, siteTitle: 'Recetas Probadas y Aprobadas'};
            if (file.data.children.length) {
                file.contents = new Buffer(uncompiledListTemplate(dataHolder));
            } else {
                file.contents = new Buffer(uncompiledArticleTemplate(dataHolder));
            }
            return file;
        }))

        // Output to build directory
        .pipe(gulp.dest('public/'));
});

gulp.task('imgs', function () {
  gulp.src('src/imgs/**/*')
    .pipe(responsive({
      '*.jpg': [{
        width: 320,
        suffix: '-320'
      },
      {
        width: 320 * 2,
        suffix: '-320-2x'
      },
      {
        width: 600,
        suffix: '-600'
      },
      {
        width: 600 * 2,
        suffix: '-600-2x'
      },
      {
        width: 900,
        suffix: '-900'
      },
      {
        width: 900 * 2,
        suffix: '-900-2x'
      }]
      //,'*.png': [{width: 900,crop: true}]
    }))

    .pipe(imageminMozjpeg({quality: 85})())

    //.pipe(imageminJpegoptim({progressive: true})())

    .pipe(gulp.dest('public/imgs'));
});


gulp.task('clean', function(cb) {
    return del('public/', cb);
});

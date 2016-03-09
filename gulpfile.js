'use strict';

var gulp = require('gulp');
var ssg = require('gulp-ssg');
var rename = require('gulp-rename');
var data = require('gulp-data');
var matter = require('gray-matter');
var textile = require('gulp-textile');
var wrap = require('gulp-wrap');
var handlebars = require('handlebars');
//var del = require('del');
var fs = require('fs');

gulp.task('html', function() {
    var template = fs.readFileSync('src/templates/article.html', 'utf8');
    var uncompiledTemplate = handlebars.compile(template);
    return gulp.src('src/content/*.textile')

        // Extract YAML front-matter using gulp-data
        .pipe(data(function(file) {
            var m = matter(String(file.contents));
            file.contents = new Buffer(m.content);
            return m.data;
        }))

        // markdown -> HTML
        /*
        .pipe(data(function (data) {
            console.log('pre-textile',data);
            var rendered = textile();
            //console.log(rendered);
            return rendered.data;
        }))
        //*/
        .pipe(textile())

        // Rename to .html
        .pipe(rename({ extname: '.html' }))

        // Run through gulp-ssg
        .pipe(ssg())

        //*
        .pipe(data(function(file) {
            console.log('\nA file:',file.contents,'\n\n')
            file.contents = new Buffer(uncompiledTemplate({file:file}));
            return file;
        }))
        //*/
        /*
        // Wrap file in template
        .pipe(wrap(
          { src: 'src/templates/article.html' },
          { siteTitle: 'Recetas Probadas y Aprobadas'},
          { engine: 'handlebars' }
        ))
        //*/

        // Output to build directory
        .pipe(gulp.dest('public/'));
});

/*
gulp.task('clean', function(cb) {
    return del('public/', cb);
});*/

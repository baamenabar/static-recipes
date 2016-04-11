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
var postcss = require('gulp-postcss');
var scssSyntax = require('postcss-scss');
var precss = require('precss');
var sass = require('gulp-sass');
var stylelint = require('stylelint');
var autoprefixer = require('autoprefixer');
var cssnano = require('cssnano');
var sourcemaps = require('gulp-sourcemaps');
var del = require('del');
var fs = require('fs');
var taskListing = require('gulp-task-listing');

// Add a task to render the output 
gulp.task('help', taskListing);

/**
 * Markup builder:
 * * Prepares the templates
 * * Parses the .textile documents
 * * Puts everything together
 */
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
            var dataHolder = {file:file, siteTitle: 'Ñam Ñam: Recetas Probadas y Aprobadas'};
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

var nanoConfig = {
        autoprefixer: false,
        safe: true
      };
var autoprefixerConfig = { browsers: ['> 1%', 'last 3 versions', 'Android >= 4', 'iOS >= 7'] };

  // This will output what browsers are considered and what properties will be preffixed 
  //console.log(autoprefixer(autoprefixerConfig).info());

/**
 * Creates CSS using postCSS
 */
gulp.task('css', function () {

  // Array of transformations to pass into post CSS.
  // This could end up in it's own file.
  var transformations = [
      stylelint(),
      require('postcss-strip-inline-comments'),
      precss({ /*options*/ }),
      autoprefixer(autoprefixerConfig),
      cssnano(nanoConfig)
    ];

  return gulp.src('src/css/*.scss')
  .pipe(sourcemaps.init())
  .pipe(postcss(transformations, {syntax:scssSyntax} ))
  .pipe(rename({ extname: '.css' }))
  .pipe(sourcemaps.write('.'))//this path is relative to the outputed css file
  .pipe(gulp.dest('public/css'));
});

/**
 * Creates CSS using Sass and postCSS
 */
gulp.task('sass', function () {
  var preTransformations = [
    stylelint()
  ];
  var postTransformations = [
    autoprefixer(autoprefixerConfig),
    cssnano(nanoConfig)
  ];

  return gulp.src('src/css/*.scss')
  .pipe(postcss(preTransformations, {syntax:scssSyntax}))
  .pipe(sourcemaps.init())
  .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
  .pipe(postcss(postTransformations))
  .pipe(sourcemaps.write('.'))//this path is relative to the outputed css file
  .pipe(gulp.dest('public/scss'));
});


/**
 * Image manipulations: 
 * * Creates different sizes for images
 * * Minifies using moz-jpeg
 */
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

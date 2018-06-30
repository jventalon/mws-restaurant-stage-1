/*eslint-env node*/
const gulp = require('gulp');
//const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const concat = require('gulp-concat');
const cssmin = require('gulp-cssmin');
//const browserSync = require('browser-sync').create();
//const eslint = require('gulp-eslint');
//const jasmine = require('gulp-jasmine-phantom');
const uglify = require('gulp-uglify');
const babel = require('gulp-babel');
const sourcemaps = require('gulp-sourcemaps');
const imagemin = require('gulp-imagemin');
//const pngquant = require('imagemin-pngquant');

gulp.task('styles', () => {
    return gulp.src('css/styles.css')
		.pipe(autoprefixer({browsers: ['last 2 versions']}))
        .pipe(cssmin())
        .pipe(concat('styles.min.css'))
		.pipe(gulp.dest('dist/css'));
});


gulp.task('watch', (done) => {
    gulp.watch('css/*.css', gulp.series(['styles']));
    //gulp.watch('js/*.js', gulp.series(['lint']));
    gulp.watch('*.html', gulp.series(['html']));
    gulp.watch('dist/*.html').on('change', browserSync.reload);
    gulp.watch('dist/css/styles.min.css').on('change', browserSync.reload);
    gulp.watch('dist/js/helpers.min.js').on('change', browserSync.reload);
    gulp.watch('dist/js/main.min.js').on('change', browserSync.reload);
    gulp.watch('dist/js/restaurant_info.min.js').on('change', browserSync.reload);
    done();
});

gulp.task('html', () => {
    return gulp.src('*.html')
        .pipe(gulp.dest('dist'));
});

gulp.task('images', () => {
    return gulp.src('img/*')
        .pipe(imagemin())
        .pipe(gulp.dest('dist/img'));
});

gulp.task('sw', () =>{
    return gulp.src('sw.js')
        .pipe(babel({
            presets: ['env']
        }))
        .pipe(gulp.dest('dist'));
});

gulp.task('scripts-main', () =>{
    return gulp.src([
            'js/idb.js',
            'js/idbhelper.js',
            'js/swhelper.js',
            'js/dbhelper.js',
            'js/main.js'
        ])
        .pipe(sourcemaps.init())
        .pipe(concat('main.min.js'))
        .pipe(babel({
            presets: ['env']
        }))
        .pipe(uglify())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('dist/js'));
});

gulp.task('scripts-restaurant', () =>{
    return gulp.src([
            'js/idb.js',
            'js/idbhelper.js',
            'js/swhelper.js',
            'js/dbhelper.js',
            'js/restaurant_info.js'
        ])
        .pipe(sourcemaps.init())
        .pipe(concat('restaurant.min.js'))
        .pipe(babel({
            presets: ['env']
        }))
        .pipe(uglify())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('dist/js'));
});

gulp.task('default', gulp.series(['html', 'images', 'styles', 'sw', 'scripts-main', 'scripts-restaurant', 'watch']));

gulp.task('dist', gulp.series(['html', 'images', 'styles', 'sw', 'scripts-main', 'scripts-restaurant']));
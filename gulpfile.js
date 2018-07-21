/*eslint-env node*/
const gulp = require('gulp');
const autoprefixer = require('gulp-autoprefixer');
const concat = require('gulp-concat');
const cssmin = require('gulp-cssmin');
const uglify = require('gulp-uglify');
const babel = require('gulp-babel');
const sourcemaps = require('gulp-sourcemaps');
const imagemin = require('gulp-imagemin');

gulp.task('styles-main', () => {
    return gulp.src([
            'css/styles.css',
            'css/main.css'
        ])
		.pipe(autoprefixer({browsers: ['last 2 versions']}))
        .pipe(cssmin())
        .pipe(concat('main.min.css'))
		.pipe(gulp.dest('dist/css'));
});

gulp.task('styles-restaurant', () => {
    return gulp.src([
            'css/styles.css',
            'css/restaurant.css'
        ])
		.pipe(autoprefixer({browsers: ['last 2 versions']}))
        .pipe(cssmin())
        .pipe(concat('restaurant.min.css'))
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

gulp.task('scripts-sw', () => {
    return gulp.src('sw.js')
        .pipe(babel({
            presets: ['env']
        }))
        .pipe(uglify())
        .pipe(gulp.dest('dist'));
});

gulp.task('scripts-main', () => {
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

gulp.task('scripts-restaurant', () => {
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

gulp.task('default', gulp.series(['html', 'images', 'styles-main', 'styles-restaurant', 'scripts-sw', 'scripts-main', 'scripts-restaurant', 'watch']));

gulp.task('dist', gulp.series(['html', 'images', 'styles-main', 'styles-restaurant', 'scripts-sw', 'scripts-main', 'scripts-restaurant']));
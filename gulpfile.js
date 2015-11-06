var gulp = require('gulp')
  , uglify = require('gulp-uglify')
  , rename = require('gulp-rename');;

gulp.task('default', function() {
  return gulp.src('./js/melon-slider.js')
    .pipe(uglify())
    .pipe(rename('melon-slider.min.js'))
    .pipe(gulp.dest('./js'));
});
var buffer = require('vinyl-buffer');
var chai = require('chai');
var cleanCSS = require('..');
var concat = require('gulp-concat');
var del = require('del');
var expect = chai.expect;
var File = require('vinyl');
var gulp = require('gulp');
var rename = require('gulp-rename');
var sourcemaps = require('gulp-sourcemaps');
var vfsFake = require('vinyl-fs-fake');

chai.should();

describe('gulp-clean-css: init', function () {

  it('should return the gulp-clean-css object: required export', function () {
    expect(cleanCSS).to.be.function;
  });
});

describe('gulp-clean-css: base functionality', function () {

  it('should allow the file through', function (done) {
    var i = 0;

    gulp.src('test/fixtures/test.css')
      .pipe(cleanCSS())
      .on('data', function (file) {
        i += 1;
      })
      .once('end', function () {
        i.should.equal(1);
        done();
      });
  });

  it('should produce the expected file', function (done) {
    var mockFile = new File({
      cwd: '/',
      base: '/test/',
      path: '/test/expected.test.css',
      contents: new Buffer('p{text-align:center;color:green}')
    });

    gulp.src('test/fixtures/test.css')
      .pipe(cleanCSS())
      .on('data', function (file) {
        file.contents.should.exist && expect(file.contents.toString()).to.equal(mockFile.contents.toString());
        done();
      });
  });

  it('should invoke optional callback with details specified in options: debug', function (done) {
    gulp.src('test/fixtures/test.css')
      .pipe(cleanCSS({debug: true}, function (details) {
        details.stats.should.exist &&
        details.stats.originalSize.should.exist &&
        details.stats.minifiedSize.should.exist;
      }))
      .on('data', function (file) {
        done();
      });
  });

  it('should invoke optional callback with out options object supplied: return object hash', function (done) {
    gulp.src('test/fixtures/test.css')
      .pipe(cleanCSS(function (details) {
        details.stats.should.exist &&
        expect(details).to.have.ownProperty('stats') &&
        expect(details).to.have.ownProperty('errors') &&
        expect(details).to.have.ownProperty('warnings') &&
        expect(details).to.not.have.ownProperty('sourceMap');
      }))
      .on('data', function (file) {
        done();
      });
  });

  it('should invoke optional callback without options object supplied: return object hash with sourceMap: true; return correct hash', function (done) {
    gulp.src('test/fixtures/test.css')
      .pipe(cleanCSS({sourceMap: true}, function (details) {
        details.stats.should.exist &&
        expect(details).have.ownProperty('sourceMap');
      }))
      .on('data', function (file) {
        done();
      });
  });

  it('should invoke optional callback with file details returned', function (done) {

    var expected = 'test.css'

    gulp.src('test/fixtures/test.css')
      .pipe(cleanCSS(function (details) {
        details.name.should.equal(expected)
      }))
      .on('data', function (file) {
        done();
      });
  });

  it('should write sourcemaps', function (done) {

    var i = 0;

    gulp.src('test/fixtures/sourcemaps/**/*.css')
      .pipe(sourcemaps.init())
      .pipe(concat('sourcemapped.css'))
      .pipe(cleanCSS())
      .on('data', function (file) {
        i += 1;
      })
      .pipe(sourcemaps.write())
      .pipe(gulp.dest(function (file) {
        return file.base;
      }))
      .once('end', function () {
        i.should.equal(1);
        done();
      });
  });

  it('should return a warning for improper syntax', function (done) {

    var i = 0;

    var css = new File({
      path: '/',
      contents: new Buffer('body{')
    });

    vfsFake.src(css)
      .pipe(cleanCSS({debug: true}, function (details) {

        expect(details.warnings).to.exist &&
        expect(details.warnings.length).to.equal(1) &&
        expect(details.warnings[0]).to.equal('Missing \'}\' after \'__ESCAPED_SOURCE_END_CLEAN_CSS__\'. Ignoring.');
      }))
      .on('data', function (file) {
        i += 1;
      })
      .once('end', function () {
        i.should.equal(1);
        done();
      });
  });

  it('should invoke a plugin error: streaming not supported', function (done) {

    gulp.src('test/fixtures/test.css', {buffer: false})
      .pipe(cleanCSS()
        .on('error', function (err) {
          expect(err.message).to.equal('Streaming not supported!')
          done();
        }));
  });

  it('should return a clean-css error', function (done) {

    var css = new File({
      path: '/',
      contents: new Buffer('@import url(/some/fake/file);')
    });

    vfsFake.src(css)
      .pipe(cleanCSS())
      .on('error', function (err) {
        expect(err).to.exist;
        expect(err).to.equal('Broken @import declaration of "/some/fake/file"');
        done();
      });
  });
});
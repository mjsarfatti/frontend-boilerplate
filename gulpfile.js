/**
 * Everything you need to start your frontend project with gulp, now.
 *
 * This setup will output a single app.js and a single app.css file, which is
 * what you will want to do in most websites (less files = less requests =
 * faster loading times). It will:
 *  - convert your ES6 files to ES5, concatenate and minify them
 * 	- convert your SCSS files to CSS, autoprefix, concatenate and minify them
 * 	- watch your JS and reload the browser on change
 * 	- watch your CSS and inject the new rules on change
 * 	- watch your HTML and PHP and reload the browser on change
 * 	- provide a server at localhost:3000 and 192.168.my.ip:3000
 * 	- make sure all browsers find the polyfills for Promise and fetch
 *
 * Moreover it can (simply uncomment the corresponding lines further down
 * the code below, they start with "EDIT HERE"):
 * 	- make sure '$' and 'jQuery' variables are available to plugins and modules
 * 	- make sure GSAP plugins find their parents (TweenLite and TweenMax)
 * 	- make sure Masonry and imagesloaded work as they are supposed to
 *
 * COMMANDS
 * $ gulp          Start watching and fire up a browser tab at localhost:3000
 * $ gulp watch    Start watching but do not open a new tab
 * $ gulp build    Build and compress all files production ready mode
 *
 */

/**
 * Edit the following to suit your project
 * @type {Object}
 */
var settings = {
	// this is the folder where your scss files reside (you can use subfolders)
	styleSrc: './src/style/**/*.{sass,scss}',

	// this is a helper for the soucemaps: make sure it matches the above
	styleMapRoot: '../../src/style/',

	// here is where app.css will end up
	styleDest: './dist/assets/css/',

	// this is the entry js file (import the whole npm catalogue here if you wish)
	jsEntry: './src/code/index.js',

	// this is a helper for the soucemaps: make sure it matches the above
	jsMapRoot: '../../src/code/',

	// this is where app.js will end up
	jsDest: './dist/assets/js/',

	// here you can tell browserSync which static (PHP, HTML, etc…) files to watch
	watch: ['./dist/**/*.html'/*, './framework/controllers/*.php', …*/ ],

	// now you have two choices: either you indicate a folder which will be
	// considered the document root by the server [docroot], or you can tell gulp
	// the domain of the virtual host you have setup eg. via apache [proxy]
	docroot: './dist',
	/*proxy: 'the-project.dev',*/

	// and finally tell autoprefixer which browsers we care about
	prefixer: ['> 1%', 'last 2 versions', 'Firefox ESR', 'Opera 12.1', 'IE >= 9']
};
// You can stop editing here, the rest will just work ;)

var fs           = require('fs');
var gulp         = require('gulp');
var gutil        = require('gulp-util');
var gulpSequence = require('gulp-sequence');
var sass         = require('gulp-sass');
var sourcemaps   = require('gulp-sourcemaps');
var autoprefixer = require('gulp-autoprefixer');
var watch        = require('gulp-watch');
var notify       = require('gulp-notify');
var webpack      = require('webpack');
var browserSync  = require('browser-sync');

gulp.task('default', function(callback) {
	global.watch = true;
	global.open = true;
	fs.writeFileSync('build.txt', 'dirty');
	gulpSequence(['sass', 'webpack'], ['watcher', 'browserSync'], callback);
});

gulp.task('watch', function(callback) {
	global.watch = true;
	fs.writeFileSync('build.txt', 'dirty');
	gulpSequence(['sass', 'webpack'], ['watcher', 'browserSync'], callback);
});

gulp.task('build', function(callback) {
	global.production = true;
	fs.writeFileSync('build.txt', new Date());
	gulpSequence(['sass', 'webpack'], callback);
});

gulp.task('sass', function () {

	var config = {
		autoprefixer: { browsers: settings.prefixer },
		sass: { outputStyle: 'compact' }
	};

	return gulp.src(settings.styleSrc)
		.pipe(sourcemaps.init())
		.pipe(sass(config.sass))
		.on('error', handleErrors)
		.pipe(autoprefixer(config.autoprefixer))
		.pipe(sourcemaps.write('./', {
			includeContent: false,
			sourceRoot: settings.styleMapRoot
		}))
		.pipe(browserSync.stream({match: '**/*.css'}))
		.pipe(gulp.dest(settings.styleDest));

});

gulp.task('webpack', function(callback) {

	var config = {
		entry: settings.jsEntry,
		output: {
			path: settings.jsDest,
			filename: 'app.js'
		},
		module: {
			loaders: [
				// EDIT HERE - get masonry to work (https://github.com/desandro/masonry/issues/679)
				/*{
					test: /(masonry-layout|imagesloaded)/,
					loader: 'imports?define=>false&this=>window'
				},*/
				{
					test: /\.js$/,
					exclude: /(node_modules)/,
					loader: 'babel-loader',
					query: { presets: ['es2015'] }
				}
			]
		},
		resolve: {
			extensions: ['', '.js'],
			alias: {
				// EDIT HERE - needed to have GSAP plugins satisfy their "requires"
				/*'TweenLite': 'gsap/src/uncompressed/TweenLite',
				'TweenMax': 'gsap/src/uncompressed/TweenMax'*/
			}
		},
		plugins: [
			new webpack.ProvidePlugin({
				'Promise': 'exports?global.Promise!es6-promise',
				'fetch': 'exports?self.fetch!whatwg-fetch',
				// EDIT HERE - make '$' and 'jQuery' available to plugins and modules
				/*$: 'jquery',
				jQuery: 'jquery'*/
			})
		]
	};

	if (global.production) {

		config.plugins.push(
			new webpack.DefinePlugin({
				// this is probably only needed by React
				'process.env': {
					'NODE_ENV': JSON.stringify('production')
				}
			}),
			new webpack.optimize.DedupePlugin(),
			new webpack.optimize.UglifyJsPlugin({
				compress: {
					warnings: false,
				}
			}),
			new webpack.NoErrorsPlugin()
		);

	} else {

		config.devtool = 'eval';
		config.output.pathinfo = true;
		webpack.debug = true;

	}

	var built = false;
	if (global.watch) {
		webpack(config).watch(200, function(err, stats) {
			logger(err, stats);
			browserSync.reload();
			// On the initial compile, let gulp know the task is done
			if (!built) { built = true; callback(); }
		});
	} else {
		webpack(config, function(err, stats) {
			logger(err, stats);
			callback();
		});
	}

});

gulp.task('watcher', ['browserSync'], function() {
	watch(settings.styleSrc, function() { gulp.start('sass'); });
});

gulp.task('browserSync', function() {

	var config = {
		open: global.open || false,
		files: settings.watch
	};

	if (settings.proxy) {
		config.proxy = settings.proxy;
	} else {
		config.server = settings.docroot;
	}

	return browserSync(config);
});

/**
 * Notify the error and let gulp go on
 */
var handleErrors = function(errorObject, callback) {
	notify.onError(errorObject.toString().split(': ').join(':\n')).apply(this, arguments);
	if (typeof this.emit === 'function') this.emit('end'); // Keep gulp from hanging on this task
};

/**
 * Log a webpack error to console
 */
var logger = function(err, stats) {
	if (err) throw new gutil.PluginError("webpack", err);

	var statColor = stats.compilation.warnings.length < 1 ? 'green' : 'yellow';

	if (stats.compilation.errors.length > 0) {
		stats.compilation.errors.forEach(function(error) {
			handleErrors(error);
			statColor = 'red';
		});
	} else {
		var compileTime = prettifyTime(stats.endTime - stats.startTime);
		gutil.log(gutil.colors[statColor](stats));
		gutil.log('Compiled with', gutil.colors.cyan('webpack:development'), 'in', gutil.colors.magenta(compileTime));
	}
};

/**
 * Format milliseconds to 999ms or 1.23s
 */
var prettifyTime = function(milliseconds) {
	if (milliseconds > 999) {
		return (milliseconds / 1000).toFixed(2) + " s";
	} else {
		return milliseconds + ' ms';
	}
};

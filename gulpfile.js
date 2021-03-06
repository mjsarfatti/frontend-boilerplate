/**
 * Everything you need to start your frontend project with gulp, now.
 *
 * This setup will output a single app.js and a single app.css file, which is
 * what you will want to do in most websites (less files = less requests =
 * faster loading times). It will:
 * 	- convert your JSX (react) into proper JS
 * 	- convert your ES2015 files to ES5, concatenate and minify them
 * 	- convert your SCSS files to CSS, autoprefix, concatenate and minify them
 * 	- watch your JS and reload the browser on change
 * 	- watch your CSS and inject the new rules on change
 * 	- watch your HTML and PHP and reload the browser on change
 * 	- provide a server at localhost:3000 and 192.168.my.ip:3000
 * 	- make sure all browsers find the polyfills for Promise and fetch
 *
 * Moreover it can (simply uncomment the corresponding lines further down
 * the code below, they start with #MASONRY, #GSAP, #FOUNDATION, #JQUERY):
 * 	- make sure '$' and 'jQuery' variables are available to plugins and modules
 * 	- make Foundation (JS and SCSS) work
 * 	- make sure GSAP plugins find their parents (TweenLite and TweenMax)
 * 	- make sure Masonry, Isotope and imagesloaded work as they are supposed to
 *
 * COMMANDS
 * $ gulp          Start watching and fire up a browser tab at localhost:3000
 * $ gulp watch    Start watching but do not open a new tab
 * $ gulp build    Build and compress all files production ready mode
 * $ gulp serve    Fire up a browser tab and serve the files at localhost:3000
 *
 */

/* eslint-disable no-multi-spaces */
const fs           = require('fs');
const path         = require('path');
const gulp         = require('gulp');
const gutil        = require('gulp-util');
const gulpSequence = require('gulp-sequence');
const sass         = require('gulp-sass');
const sourcemaps   = require('gulp-sourcemaps');
const autoprefixer = require('gulp-autoprefixer');
const watch        = require('gulp-watch');
const notify       = require('gulp-notify');
const webpack      = require('webpack');
const browserSync  = require('browser-sync');
const concat       = require('gulp-concat');
const uglify       = require('gulp-uglify');
/* eslint-enable no-multi-spaces */

/**
 * Edit the following to suit your project
 * (or, better, edit gulpconfig.js)
 * @type {Object}
 */
const settings = {
	// this is the folder where your scss files reside (you can use subfolders)
	styleSrc: './src/style/**/*.{sass,scss}',

	// this is a helper for the soucemaps: make sure it matches the above,
	// it's relative to the position of the final css
	styleMapRoot: '../../src/style/',

	// here is where app.css will end up
	styleDest: './dist/assets/css/',

	// set this to 'webpack' if you want CommonJS-like modules support, leave it to 'js' if all you
	// need is minification and concatenation
	jsTasker: 'js',

	// this is the entry js file(s) (the array keys define the output filenames),
	// it's used only by the 'webpack' task
	jsEntry: {
		app: ['./src/code/index.js'],
	},

	// this is the list of files and/or folders where your js source files reside: they will be
	// minified and concatenated in this order (so put files such as jQuery first).
	// It's used by the 'js' task
	jsSrc: ['./src/code/**/*.js'],

	// this is a helper for the soucemaps: make sure it matches the above,
	// it's relative to the position of the final css
	jsMapRoot: '../../src/code/',

	// this is where the files defined in jsEntry will end up
	jsDest: path.join(__dirname, '/dist/assets/js/'),

	// here you can tell browserSync which static (PHP, HTML, etc…) files to watch
	watch: ['./dist/**/*.html'/* , './framework/controllers/*.php', … */],

	// now you have two choices: either you indicate a folder which will be
	// considered the document root by the server [docroot], or you can
	// specify which virtual host domain to proxy in gulpconfig.js (comment this
	// line and uncomment below to include gulpconfig.js)
	docroot: './dist',

	// and finally tell autoprefixer which browsers we care about
	prefixer: ['> 1%', 'last 2 versions', 'Firefox ESR', 'Opera 12.1', 'IE >= 9'],
};

// Merge settings with local config
const localConfig = require('./gulpconfig');

for (const attrName in localConfig) { // eslint-disable-line
	if (localConfig.hasOwnProperty(attrName)) { // eslint-disable-line
		settings[attrName] = localConfig[attrName];
	}
}

// You can stop editing here, the rest will just work, unless you need
// Masonry, GSAP, jQuery or Foundation, then keep looking down --v

/**
 * Notify the error and let gulp go on
 */
function handleErrors(errorObject, callback) { // eslint-disable-line
	// eslint-disable-next-line
	notify.onError(errorObject.toString().split(': ').join(':\n')).apply(this, arguments);
	if (typeof this.emit === 'function') this.emit('end'); // Keep gulp from hanging on this task
}

/**
 * Format milliseconds to 999ms or 1.23s
 */
function prettifyTime(milliseconds) {
	if (milliseconds > 999) {
		return `${(milliseconds / 1000).toFixed(2)} ms`;
	}

	return `${milliseconds} ms`;
}

/**
 * Log a webpack error to console
 */
function logger(err, stats) {
	let statColor;
	let compileTime;

	if (err) throw new gutil.PluginError('webpack', err);

	statColor = stats.compilation.warnings.length < 1 ? 'green' : 'yellow';

	if (stats.compilation.errors.length > 0) {
		stats.compilation.errors.forEach((error) => {
			handleErrors(error);
			statColor = 'red';
		});
	} else {
		compileTime = prettifyTime(stats.endTime - stats.startTime);
		gutil.log(gutil.colors[statColor](stats));
		gutil.log('Compiled with', gutil.colors.cyan('webpack:development'), 'in', gutil.colors.magenta(compileTime));
	}
}

gulp.task('default', (callback) => {
	global.watch = true;
	global.open = true;
	fs.writeFileSync('build.txt', 'dirty');
	gulpSequence(['sass', settings.jsTasker], ['watcher', 'browserSync'], callback);
});

gulp.task('watch', (callback) => {
	global.watch = true;
	fs.writeFileSync('build.txt', 'dirty');
	gulpSequence(['sass', settings.jsTasker], ['watcher', 'browserSync'], callback);
});

gulp.task('build', (callback) => {
	global.production = true;
	fs.writeFileSync('build.txt', new Date());
	gulpSequence(['sass', settings.jsTasker], callback);
});

gulp.task('serve', (callback) => {
	global.open = true;
	gulpSequence(['browserSync'], callback);
});

gulp.task('sass', () => {

	const outputStyle = global.production ? 'compressed' : 'compact';
	const config = {
		autoprefixer: { browsers: settings.prefixer },
		sass: {
			// #FOUNDATION - Uncomment here
			/* includePaths: [
				'./node_modules/foundation-sites/scss/',
				'./node_modules/motion-ui/src/',
			], */
			outputStyle,
		},
	};

	return gulp.src(settings.styleSrc)
		.pipe(sourcemaps.init())
		.pipe(sass(config.sass))
		.on('error', handleErrors)
		.pipe(autoprefixer(config.autoprefixer))
		.pipe(sourcemaps.write('./', {
			includeContent: false,
			sourceRoot: settings.styleMapRoot,
		}))
		.pipe(gulp.dest(settings.styleDest))
		.pipe(browserSync.stream({ match: '**/*.css' }))
		.pipe(gulp.dest(settings.styleDest));

});

gulp.task('js', () => {
	gulp.src(settings.jsSrc)
		.pipe(sourcemaps.init())
		.pipe(concat('app.js'))
		.pipe(uglify())
		.on('error', handleErrors)
		.pipe(sourcemaps.write('./', {
			includeContent: false,
			sourceRoot: settings.jsMapRoot,
		}))
		.pipe(gulp.dest(settings.jsDest));
	browserSync.reload();
});

gulp.task('webpack', (callback) => {

	let built = false;
	const config = {
		entry: settings.jsEntry,
		output: {
			path: settings.jsDest,
			filename: '[name].js',
		},
		module: {
			rules: [
				// #MASONRY - Uncomment here
				// (https://github.com/desandro/masonry/issues/679)
				/* {
					test: /(masonry-layout|isotope-layout|imagesloaded)/,
					loader: 'imports?define=>false&this=>window'
				}, */
				// #JQUERY - Uncomment this
				// (make '$' and 'jQuery' globals)
				/* {
					test: /\/jquery\.js$/,
					loader: 'expose-loader?$!expose-loader?jQuery'
				}, */
				{
					test: /\.jsx?$/,
					exclude: /node_modules\/(?!foundation)/,
					loader: 'babel-loader',
					query: { presets: ['es2016', 'es2015', 'react'] },
				},
				{
					enforce: 'pre',
					test: /\.jsx?$/, // include .js files
					exclude: /node_modules/, // exclude any and all files in the node_modules folder
					loader: 'eslint-loader',
				},
			],
		},
		resolve: {
			extensions: ['.js', '.jsx'],
			alias: {
				// #GSAP - Uncomment here
				// (needed to have GSAP plugins satisfy their "requires")
				/* 'TweenLite': 'gsap/src/uncompressed/TweenLite',
				'TweenMax': 'gsap/src/uncompressed/TweenMax', */
			},
		},
		plugins: [
			new webpack.ProvidePlugin({
				Promise: 'promise-polyfill',
				fetch: 'exports-loader?self.fetch!whatwg-fetch',
			}),
		],
	};

	if (global.production) {

		config.plugins.push(
			new webpack.DefinePlugin({
				// this is probably only needed by React
				'process.env': {
					NODE_ENV: JSON.stringify('production'),
				},
			}),
			new webpack.optimize.UglifyJsPlugin({
				compress: {
					warnings: false,
				},
			}),
			new webpack.NoEmitOnErrorsPlugin() // eslint-disable-line
		);

	} else {

		config.devtool = 'eval';
		config.output.pathinfo = true;
		webpack.debug = true;

	}

	if (global.watch) {
		webpack(config).watch(200, (err, stats) => {
			logger(err, stats);
			browserSync.reload();
			// On the initial compile, let gulp know the task is done
			if (!built) { built = true; callback(); }
		});
	} else {
		webpack(config, (err, stats) => {
			logger(err, stats);
			callback();
		});
	}

});

gulp.task('watcher', ['browserSync'], () => {
	watch(settings.styleSrc, () => { gulp.start('sass'); });
});

gulp.task('browserSync', () => {

	const config = {
		open: global.open || false,
		files: settings.watch,
	};

	if (settings.proxy) {
		config.proxy = settings.proxy;
	} else {
		config.server = settings.docroot;
	}

	return browserSync(config);
});

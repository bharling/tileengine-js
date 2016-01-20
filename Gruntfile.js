module.exports = function (grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		coffee: {
			compile: {
				files: {
					'main.js' : 'main.coffee'
				}
			}

		},

		watch : {
			options: {
				livereload : true,
			},
			files: ['**/*.coffee'],
			tasks: ['coffee'],
		}
	});


	grunt.loadNpmTasks('grunt-contrib-coffee');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.registerTask('default', ['coffee']);
};
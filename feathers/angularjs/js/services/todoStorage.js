/*global angular */

/**
 * Services that persists and retrieves todos from localStorage or a backend API
 * if available.
 *
 * They both follow the same API, returning promises for all changes to the
 * model.
 */
angular.module('todomvc')
	.factory('todoStorage', function ($http, $injector, $q) {
		'use strict';

		var deferred = $q.defer();
		deferred.resolve($injector.get('feathers'));
		return deferred.promise;
	})
	.factory('feathers', function ($q) {
		'use strict';

		var URL = 'http://todos.feathersjs.com';
		var socket = io(URL);
		var app = feathers().configure(feathers.socketio(socket));
		var service = app.service('todos');
		var store = {
			todos: [],

			serviceHandler: function(deferred) {
				return function(error) {
					if(error) {
						return deferred.reject(error);
					}
					deferred.resolve(store.todos);
				};
			},

			createTodo: function(todo) {
				store.todos.push(todo);
			},

			updateTodo: function(todo) {
				store.todos.forEach(function(current, index) {
					if(current.id === todo.id) {
						store.todos[index] = todo;
					}
				});
			},

			removeTodo: function(todo) {
				store.todos.forEach(function(current, index) {
					if(current.id === todo.id) {
						store.todos.splice(index, 1);
					}
				});
			},

			clearCompleted: function () {
				var deferred = $q.defer();

				store.todos.forEach(function (todo) {
					if (todo.complete) {
						service.remove(todo.id);
					}
				});

				deferred.resolve(store.todos);

				return deferred.promise;
			},

			delete: function (todo) {
				var deferred = $q.defer();

				service.remove(todo.id, store.serviceHandler(deferred));

				return deferred.promise;
			},

			get: function () {
				var deferred = $q.defer();

				service.find(function(error, todos) {
					if(error) {
						return deferred.reject(error);
					}

					angular.copy(todos, store.todos);
					deferred.resolve(store.todos);
				});

				return deferred.promise;
			},

			insert: function (todo) {
				var deferred = $q.defer();

				service.create(todo, store.serviceHandler(deferred));

				return deferred.promise;
			},

			put: function (todo) {
				var deferred = $q.defer();

				service.update(todo.id, todo, store.serviceHandler(deferred));

				return deferred.promise;
			}
		};

		service.on('created', store.createTodo);
		service.on('updated', store.updateTodo);
		service.on('removed', store.removeTodo);

		return store;
	});

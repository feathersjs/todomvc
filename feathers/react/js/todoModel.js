/*jshint quotmark:false */
/*jshint white:false */
/*jshint trailing:false */
/*jshint newcap:false */
var app = app || {};

(function () {
	'use strict';

	var Utils = app.Utils;
	// Generic "model" object. You can use whatever
	// framework you want. For this application it
	// may not even be worth separating this logic
	// out, but we do this to demonstrate one way to
	// separate out parts of your application.
	app.TodoModel = function (host) {
		this.socket = io(host);
		this.app = feathers().configure(feathers.socketio(this.socket));
		this.service = this.app.service('todos');
		this.onChanges = [];
		this.todos = [];

		this.service.find(function(error, todos) {
			this.todos = todos;
			this.inform();
		}.bind(this));

		this.service.on('created', this.createTodo.bind(this));
		this.service.on('updated', this.updateTodo.bind(this));
		this.service.on('removed', this.removeTodo.bind(this));
	};

	app.TodoModel.prototype.subscribe = function (onChange) {
		this.onChanges.push(onChange);
	};

	app.TodoModel.prototype.inform = function () {
		this.onChanges.forEach(function (cb) { cb(); });
	};

	app.TodoModel.prototype.createTodo = function(todo) {
		this.todos = this.todos.concat(todo);
		this.inform();
	}

	app.TodoModel.prototype.updateTodo = function(todo) {
		this.todos = this.todos.map(function(current) {
			return todo.id === current.id ? todo : current;
		});

		this.inform();
	}

	app.TodoModel.prototype.removeTodo = function(todo) {
		this.todos = this.todos.filter(function(current) {
			return todo.id !== current.id;
		});

		this.inform();
	}

	app.TodoModel.prototype.addTodo = function (text) {
		this.service.create({
			text: text,
			complete: false
		});
	};

	app.TodoModel.prototype.toggleAll = function (checked) {
		var service = this.service;
		this.todos.forEach(function(todo) {
			service.update(todo.id, Utils.extend({}, todo, { complete: checked }));
		});
	};

	app.TodoModel.prototype.toggle = function (todoToToggle) {
		var todo = Utils.extend({}, todoToToggle, {complete: !todoToToggle.complete });
		this.service.update(todo.id, todo);
	};

	app.TodoModel.prototype.destroy = function (todo) {
		this.service.remove(todo.id);
	};

	app.TodoModel.prototype.save = function (todo, text) {
		this.service.update(todo.id, Utils.extend({}, todo, { text: text }));
	};

	app.TodoModel.prototype.clearCompleted = function () {
		var service = this.service;
		this.todos.forEach(function(todo) {
			if(todo.complete) {
				service.remove(todo.id);
			}
		});
	};
})();

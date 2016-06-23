if (typeof console === 'undefined') console = {
	log: function() { },
	error: function() { }
}; // IE
window.log = Function.prototype.bind.call(console.log, console); // shorthand

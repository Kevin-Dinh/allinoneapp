/*
 * author: akumor
 *   
 */

define([
	"dojo/_base/declare"
], function(declare) {
	return declare(null, {
		
		// summary:
		//		Mixin for _FormValueWidgets that will fire 'change' event after 'changeDelay' milis
		// description:
		//		Use this mixin with _FormValueWidget, when intermediateChages are required, 
		//		but with some delay, allowing user to type full value. 
		//		(e.g. when user input will cause XHR request and he is still typing, 
		//		do not sent the request imediatelly after each character)
		
		// changeDelay: Number
		//		Miliseconds to wait until (last) user input will fire 'change' event
		changeDelay : 400,
		
		intermediateChanges : true,

		_onInput : function(/*Event*/evt) {
			// summary:
			//		Called AFTER the input event has happened
			if (this._deferChange) {
				this._deferChange.remove();
			}

			this._processInput(evt);

			this._deferChange = this.defer(function() {
				this._handleOnChange(this.get('value'));
			}, this.changeDelay);
			this._updatePlaceHolder();
		}
	});
});
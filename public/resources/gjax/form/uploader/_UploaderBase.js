/**
 * widget			Uploader
 * created			10/26/2012
 * @author	 		arakovsky
 */

define([
	"dojo/_base/declare",
	"dojo/_base/connect",
	"dojo/_base/array",
	"dojo/dom-construct",
	"dojox/form/Uploader"
], function(declare, connect, array, domConstruct, Uploader) {

	return declare(Uploader, {
		// summary:
		//		Base class for gjax/form/Uploader
		//
		// description:
		//		Extends dojox/form/Uploader to support AMD loading and appending to already selected files
		_connectButton : function() {
			this.own(connect.connect(this.inputNode, "change", this, function(evt) {
				//----AR: this will alow append to already selected files in HTML5 plugin---
				var i, l;
				if (this.supports("multiple") && this.multiple) {
					this._files = (this._files || []);
					for (i = 0, l = this.inputNode.files.length; i < l; i++) {
						var alreadyAppend = false, _this = this;
						/*jshint loopfunc:true*/
						array.some(this._files, function(file) {
							if (file.name === _this.inputNode.files[i].name && file.size === _this.inputNode.files[i].size) {
								alreadyAppend = true;
								return true;
							}
						});
						if (!alreadyAppend) {
							this._files.push(this.inputNode.files[i]);
						}
					}
				} else {
					var inputFiles = this.getFileList(evt);
					for (i = 0; i < inputFiles.length - 1; i++) {
						if (inputFiles[i].name === inputFiles[inputFiles.length - 1].name) {
							domConstruct.destroy(this._inputs[this._inputs.length - 1]);
							this._inputs.pop();
							break;
						}
					}
					this._files = this.inputNode.files;
				}
				//-------------------
				this.onChange(this.getFileList(evt));
				if (!this.supports("multiple") && this.multiple) {
					this._createInput();					
				}
			}));

			if (this.tabIndex > -1) {
				this.inputNode.tabIndex = this.tabIndex;

				this.own(connect.connect(this.inputNode, "focus", this, function() {
					this.titleNode.style.outline = ""; //Krajnik: remove redudant outline on Search Button
					//this.titleNode.style.outline= "1px dashed #ccc";
				}));
				this.own(connect.connect(this.inputNode, "blur", this, function() {
					this.titleNode.style.outline = "";
				}));
			}
		}
	});
});
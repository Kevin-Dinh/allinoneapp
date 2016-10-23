/**
 * widget			MessagePane
 * created			03/29/2012
 * @author	 		mhlavac
 * @description		
 */
define([
	"dojo/on",
	"dojo/aspect",
	"dojo/_base/array",
	"dojo/_base/declare",
	"dojo/Deferred",
	"dojo/fx",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"dojo/html",
	"dojo/window",
	"dijit/form/Button",
	"dojo/dom-construct",
	"gjax/_base/dom"
], function(on, aspect, array, declare, Deferred, fxUtils, _Widget, _TemplatedMixin, _WidgetsInTemplateMixin, html, window, Button, domConstruct, gdom) {
	//CODEREVIEW: testcase needed for this (also stress test proving this will not leak)

	// module:
	//		gjax/message/MessagePane

	return declare([
		_Widget,
		_TemplatedMixin,
		_WidgetsInTemplateMixin
	], {

		// summary:
		//		Widget that displays various type of messages as formatted and closable panes. 

		templateString : "<div class='gjax-message-pane'><ul data-dojo-attach-point='msgUl'></ul></div>",

		_showing : false,
		_msgCount : 0,

		buildRendering : function() {
			this.inherited(arguments);
		},

		onShow : function(/*===== msgCount =====*/) {
			// summary:
			//		Callback when this widget's is shown
			// tags:
			//		callback
		},
		onHide : function(/*===== msgCoun =====*/) {
			// summary:
			//		Callback when this widget's is hidden
			// tags:
			//		callback
		},

		postCreate : function() {
			this.inherited(arguments);

			var _this = this;
			this._wipeIn = fxUtils.wipeIn({
				node : _this.msgUl,
				duration : 100,
				beforeBegin : function() {
					gdom.show(_this.domNode);
				}
			});
			this._wipeOut = fxUtils.wipeOut({
				node : _this.msgUl,
				duration : 100,
				onEnd : function() {
					gdom.hide(_this.domNode);
				}
			});

			gdom.show(this.domNode);
			gdom.show(this.msgUl);
		},

		startup : function() {
			if (this._started) {
				return;
			}

			this.inherited(arguments);
			this._msgCount = 0;
		},

		showMessage : function(msgHTML, type) {
			// summary:
			//		Shows single message of given type. Previous messages are removed.
			// msgHTML: String
			//		Message text (or markup)
			// type:	String
			//		Type of message
			this._clearMsgUl();
			var msgLi = this._createMsgLi(type);

			html.set(msgLi.contentSpan, msgHTML);/* git-qa */
			return this._setShowing(true);
		},

		addMessage : function(msgHTML, type, position) {
			// summary:
			//		Shows message of given type. Previous messages are preserved.
			// msgHTML: String
			//		Message text (or markup)
			// type:	String
			//		Type of message
			// position:	?String
			//		'first' or 'last'
			var msgLi = this._createMsgLi(type, position);
			html.set(msgLi.contentSpan, msgHTML);/* git-qa */
		},

		clean : function() {
			// summary:
			//		Removes all messages
			this._setShowing(false);
			this._clearMsgUl();
		},

		show : function() {
			// summary:
			//		Returns this widget to visible state
			return this._setShowing(true);
		},

		hide : function() {
			// summary:
			//		Hides this widget to visible state
			return this._setShowing(false);
		},

		_setShowing : function(show) {
			// if (show)
			// domClass.add(this.domNode, "gjaxHidden");
			// else
			// domClass.remove(this.domNode, "gjaxHidden");

			var _this = this;
			var def = new Deferred();

			if (this._showing == show && this._wipeIn.status() != "playing" && this._wipeOut.status() != "playing") {
				def.resolve(show);
			} else {
				array.forEach([
					_this._wipeIn,
					_this._wipeOut
				], function(animation) {
					if (animation && animation.status() == "playing") {
						animation.stop();
					}
				});
				var anim = _this[show ? "_wipeIn" : "_wipeOut"];
				var h = aspect.after(anim, "onEnd", function() {
					h.remove();
					_this._showing = show;
					def.resolve(show);
					_this[show ? "onShow" : "onHide"](_this._msgCount);
				});
				anim.play();
			}

			if (show) {//mbeliansky - do not scroll on hide/clean
				window.scrollIntoView(this.domNode); //pkrajnik - scroll to position of message
			}

			return def;
		},

		_clearMsgUl : function() {
			domConstruct.empty(this.msgUl);
			if (this._msgCount) {
				this._msgCount = 0;
				this.onHide(this._msgCount);
			}
		},

		_createMsgLi : function(type, position) {
			// allowed message types
			var types = [ //CODEREVIEW: CRV (which CRV ???)
				"error",
				"delete",
				"save",
				"warning",
				"success",
				"info"
			];

			var msgLi = domConstruct.create('li', {
				"class" : "gccs-message " + (type && ~array.indexOf(types, type) ? type : "info")
			}, this.msgUl, position || "last");
			// on <p> css image is created, contentSpan rename?

			var closeBtn = new Button({
				"class" : "button-edition-delete-2 transparent"
			}, domConstruct.create('div', {}, msgLi));
			closeBtn._msgLi = msgLi;

			var contentSpan = domConstruct.create('p', {}, msgLi);

			var _this = this;
			on.once(closeBtn, "click", function() {
				var li = closeBtn._msgLi;

				fxUtils.wipeOut({
					node : li,
					duration : 100,
					onBegin : function() {
						// PM: unfocus button before end of animation, IE bug fix - change tabs after close (toLowerCase error)
						if (closeBtn.focusNode) {
							closeBtn.focusNode.blur();
						}
					},
					onEnd : function() {
						closeBtn.destroy();
						domConstruct.destroy(li);
						_this.onHide(--_this._msgCount);
					}
				}).play();
			});

			msgLi.contentSpan = contentSpan;
			this._msgCount++;

			return msgLi;
		}
	});
});
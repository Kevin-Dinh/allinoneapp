define([
	"dojo/_base/declare",
	"dojo/dom-class",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"dijit/layout/_ContentPaneResizeMixin",
	"./_ViewMixin",
	"./_MessagePaneMixin",
	"dijit/layout/ContentPane",
	"dijit/Dialog"
], function(declare, domClass, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, _ContentPaneResizeMixin, _ViewMixin,
		_MessagePaneMixin, ContentPane, Dialog) {

	// we must define one more class in hierarchy, because both _WidgetsInTemplateMixin and _ContentPaneResizeMixin defines startup, 
	// and one of them would be overriden by second one if both mixins would be used together
	var TemplatedWidget = declare([
		_WidgetBase,
		_TemplatedMixin,
		_WidgetsInTemplateMixin
	]);

	return declare([
		TemplatedWidget,
		_ContentPaneResizeMixin,
		_ViewMixin,
		_MessagePaneMixin
	], {
		// summary:
		// 		Base class for Views.
		//
		// description:
		// 		Prefixes all 'id' and 'for' attributes with widget ID.

		baseClass : "gjaxView dijitContentPane",
		doLayout : false,
		constructor : function(props) {
			// summary:
			//		Ensures conditional MVC data binding.

			// setting target to true on instance will ensure that this widdget will be selected as parent for children binding
			// because target with at() will be removed temporarily from props
			if (props && "target" in props) {
				this.target = true;
			}
		},

		// Cancel _WidgetBase's _setTitleAttr because we don't want the title attribute (used to specify
		// tab labels) to be copied to ContentPane.domNode... otherwise a tooltip shows up over the
		// entire view.
		//inpired by ContentPane
		//Do not move to _ViewMixin, because it would cause templatedDialog to not have title
		_setTitleAttr : null,

		buildRendering : function() {
			this.templateString = this._prefixTemplateIds(this.templateString);
			this.inherited(arguments);
			domClass.add(this.domNode, "view");
			if (!this.containerNode) {
				this.containerNode = this.domNode;
			}
		},

		allowSingleChild : false,
		// allowSingleChild: [const] Boolean
		//		If set to true, allows this view to be indentified as single child

		startup : function() {
			this.inherited(arguments);

			if (!this.allowSingleChild) {
				// remove behaviour that makes ContentPane to not show scrollbar if it has only one child widget
				var parent = this.getParent();
				//&& !(parent instanceof Dialog) - this will allow single child of dialog to be resized on dialog show
				if (parent && parent instanceof ContentPane && !(parent instanceof Dialog)) {
					domClass.remove(parent.containerNode, parent.baseClass + "SingleChild");
					delete parent._singleChild;
					parent._checkIfSingleChild = function() {
					};
				}
			}
			this.resize();
		},

		_getMessagePaneRefAttr : function() {
			//view searches for MessagePane with id 'defaultMessagePane', if not found, creates its own message pane
			if (this.messagePaneRef) {
				return this.messagePaneRef;
			}
			var p = this;
			while ((p = p.getParent()) != null) {
				if (p.isInstanceOf(_MessagePaneMixin)) {
					return p.get("messagePaneRef");
				}
			}

			return this.inherited(arguments);
		},

		//create ID for nested widget (prefixes given 'id with this.id+"_"')
		//this method should not be needed if testing is done using testIds
		createId : function(id) {
			return this.id + "_" + id;
		},

		//methods taken from _Widget
		_onShow : function() {
			// summary:
			//		Internal method called when this widget is made visible.
			//		See `onShow` for details.

			// Need to keep track of whether ContentPane has been shown (which is different than
			// whether or not it's currently visible).
			this._wasShown = true;

			this.onShow();
		},

		onShow : function() {
			// summary:
			//		Called when this widget becomes the selected pane in a
			//		`dijit/layout/TabContainer`, `dijit/layout/StackContainer`,
			//		`dijit/layout/AccordionContainer`, etc.
			//
			//		Also called to indicate display of a `dijit/Dialog`, `dijit/TooltipDialog`, or `dijit/TitlePane`.
			// tags:
			//		callback
		},

		onHide : function() {
			// summary:
			//		Called when another widget becomes the selected pane in a
			//		`dijit/layout/TabContainer`, `dijit/layout/StackContainer`,
			//		`dijit/layout/AccordionContainer`, etc.
			//
			//		Also called to indicate hide of a `dijit/Dialog`, `dijit/TooltipDialog`, or `dijit/TitlePane`.
			// tags:
			//		callback
		},

		onClose : function() {
			// summary:
			//		Called when this widget is being displayed as a popup (ex: a Calendar popped
			//		up from a DateTextBox), and it is hidden.
			//		This is called from the dijit/popup code, and should not be called directly.
			//
			//		Also used as a parameter for children of `dijit/layout/StackContainer` or subclasses.
			//		Callback if a user tries to close the child.   Child will be closed if this function returns true.
			// tags:
			//		extension

			return true; // Boolean
		}

	});
});

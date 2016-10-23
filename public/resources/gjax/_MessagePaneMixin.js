define([
	"dojo/_base/declare",
	"./message/MessagePane"
], function(declare, MessagePane) {

	var _MessagePaneMixin = declare(null, {
		// summary:
		//		Mixin that adds 'message' feature - displaying messages in MessagePane
		// description:
		//		This module adds 'message' method and functionality for lookup of right MessagePane
		//		Mix this module to any whidget (e.g. TitlePane) in which you want to display messages in MessagePane
		//		If 'createMessagePane' property is set to false, it can usded to add 'message' method to module, but use one of parent widgets to display the message

		message : function(type, message, keepPrevious) {

			var messagePane = this.get("messagePaneRef");

			if (type == null || type == "clean") {
				messagePane.clean();
			} else if (keepPrevious) {
				messagePane.addMessage(message, type);
				messagePane.show();
			} else {
				messagePane.showMessage(message, type);
			}
		},
		messagePaneRef : null,
		_getMessagePaneRefAttr : function() {
			//abstract method, override in sub classes
			if (this.messagePaneRef) {
				return this.messagePaneRef;
			}

			if (this.createMessagePane) {
				return this.createMessagePane();
			} else {
				var p = this;
				while ((p = p.getParent()) != null) {
					if (p.isInstanceOf(_MessagePaneMixin)) {
						return p.get("messagePaneRef");
					}
				}
				return this.createMessagePane(this.containerNode || this.domNode, "first");
			}

		},

		// createMessagePane: [const] Function|Boolean
		//		Function that creates message pane, may be set to 'false' to prevent creating message pane in this widget
		createMessagePane : function(node, position) {
			var mp = this.messagePaneRef = new MessagePane();
			mp.placeAt(node || this.containerNode || this.domNode, position || "first");
			mp.startup();
			return mp;
		}

	});

	return _MessagePaneMixin;
});

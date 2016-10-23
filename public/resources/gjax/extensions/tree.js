define([
	"dijit/Tree",
	"dojo/_base/lang",
	"dojo/Deferred",
	"gjax/error",
	"dojo/_base/array",
	"gjax/log/level"
], function(Tree, lang, Deferred, error, array, level) {
	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: errorHandling capatibilities added to dijit/Tree");
	level("debug", "gjax/extensions") && console.debug("GJAX EXTEND: prevents all interaction and focus when dijit/Tree is disabled");

	Tree._TreeNode.extend({
		focus : lang.partial(preventIfDisabled, Tree._TreeNode.prototype.focus)
	});

	Tree.extend({

		errorHandler : null,
		_load : function() {
			// summary:
			//		Initial load of the tree.
			//		Load root node (possibly hidden) and it's children.
			this.model.getRoot(lang.hitch(this, function(item) {
				var rn = (this.rootNode = this.tree._createTreeNode({
					item : item,
					tree : this,
					isExpandable : true,
					label : this.label || this.getLabel(item),
					textDir : this.textDir,
					indent : this.showRoot ? 0 : -1
				}));

				if (!this.showRoot) {
					rn.rowNode.style.display = "none";
					// if root is not visible, move tree role to the invisible
					// root node's containerNode, see #12135
					this.domNode.setAttribute("role", "presentation");
					this.domNode.removeAttribute("aria-expanded");
					this.domNode.removeAttribute("aria-multiselectable");

					// move the aria-label or aria-labelledby to the element with the role
					if (this["aria-label"]) {
						rn.containerNode.setAttribute("aria-label", this["aria-label"]);
						this.domNode.removeAttribute("aria-label");
					} else if (this["aria-labelledby"]) {
						rn.containerNode.setAttribute("aria-labelledby", this["aria-labelledby"]);
						this.domNode.removeAttribute("aria-labelledby");
					}
					rn.labelNode.setAttribute("role", "presentation");
					rn.labelNode.removeAttribute("aria-selected");
					rn.containerNode.setAttribute("role", "tree");
					rn.containerNode.setAttribute("aria-expanded", "true");
					rn.containerNode.setAttribute("aria-multiselectable", !this.dndController.singular);
				} else {
					this.domNode.setAttribute("aria-multiselectable", !this.dndController.singular);
					this.rootLoadingIndicator.style.display = "none";
				}

				this.containerNode.appendChild(rn.domNode);
				var identity = this.model.getIdentity(item);
				if (this._itemNodesMap[identity]) {
					this._itemNodesMap[identity].push(rn);
				} else {
					this._itemNodesMap[identity] = [
						rn
					];
				}

				rn._updateLayout(); // sets "dijitTreeIsRoot" CSS classname

				// Load top level children, and if persist==true, all nodes that were previously opened
				this._expandNode(rn).then(lang.hitch(this, function() {
					// Then, select the nodes specified by params.paths[], assuming Tree hasn't been deleted.
					if(!this._destroyed){
						this.rootLoadingIndicator.style.display = "none";
						this.expandChildrenDeferred.resolve(true);
					}
				}));
			}), lang.hitch(this, function(err) {
				//AR: if errorHandler is specified call it instead of console.error
				if (this.errorHandler) {
					this.errorHandler(error.newError(new Error(), "Error loading tree root", err, "gjax/extensions/tree"));
				} else {
					console.error(this, ": error loading root: ", err);
				}
			}));
		},

		_expandNode : function(/*TreeNode*/node) {
			// summary:
			//		Called when the user has requested to expand the node
			// returns:
			//		Promise that resolves when the node is loaded and opened and (if persist=true) all it's descendants
			//		that were previously opened too

			if (node._expandNodeDeferred) {
				// there's already an expand in progress, or completed, so just return
				return node._expandNodeDeferred; // dojo/Deferred
			}

			var model = this.model, item = node.item, _this = this;

			// Load data if it's not already loaded
			if (!node._loadDeferred) {
				// need to load all the children before expanding
				node.markProcessing();

				// Setup deferred to signal when the load and expand are finished.
				// Save that deferred in this._expandDeferred as a flag that operation is in progress.
				node._loadDeferred = new Deferred();

				// Get the children
				model.getChildren(item, function(items) {
					node.unmarkProcessing();

					// Display the children and also start expanding any children that were previously expanded
					// (if this.persist == true).   The returned Deferred will fire when those expansions finish.
					node.setChildItems(items).then(function() {
						node._loadDeferred.resolve(items);
					});
				}, function(err) {
					//AR: if errorHandler is specified, do not call console.error, but wrap error; and specify deferred errback (see below)
					if (this.errorHandler) {
						node._loadDeferred.reject(error.newError(new Error(), "Error loading tree root", err, "gjax/extensions/tree"));
					} else {
						console.error(_this, ": error loading " + node.label + " children: ", err);
						node._loadDeferred.reject(err);
					}
				});
			}

			// Expand the node after data has loaded
			var def = node._loadDeferred.then(lang.hitch(this, function() {
				var def2 = node.expand();

				// seems like these should delayed until node.expand() completes, but left here for back-compat about
				// when this.isOpen flag gets set (ie, at the beginning of the animation)
				this.onOpen(node.item, node);
				this._state(node, true);

				return def2;
			}), this.errorHandler); //AR: specify errorBack, (does not matter if it is not specified)

			this._startPaint(def); // after this finishes, need to reset widths of TreeNodes

			return def; // dojo/promise/Promise
		},

		// prevent focusing/navigation when disabled

		// overrides _KeyNavMixin._onContainerFocus
		_onContainerFocus : lang.partial(preventIfDisabled, Tree.prototype._onContainerFocus),

		// overrides _KeyNavMixin._onContainerKeydown
		_onContainerKeydown : lang.partial(preventIfDisabled, Tree.prototype._onContainerKeydown),

		focus : lang.partial(preventIfDisabled, Tree.prototype.focus),

		__click : lang.partial(preventIfDisabled, Tree.prototype.__click)

	});

	function preventIfDisabled(origFnc) {
		var args = Array.prototype.slice.call(arguments, 1);
		if (!this.disabled) {
			origFnc.apply(this, args);
		} else {
			// stop event is present in arguments
			array.some(args, function(arg) {
				if (arg && arg.stopPropagation) {
					arg.stopPropagation();
					arg.preventDefault();
					return true;
				}
			});
		}
	}
});

define([
	"dgrid/extensions/Pagination",
	"dojo/dom-construct"
], function(Pagination, domConstruct) {

	console.debug("GJAX FIX: Paged grids always refresh current page when new item is inserted");
	// JU,AR: originally Observable causes refresh of first page only
	console.debug("GJAX EXTEND: Pagination::firstArrow property added");

	var originalBuildRendering = Pagination.prototype.buildRendering;
	Pagination.extend({

		// NOTE: this will cause two query requests on first page, one by original code, one by this, we don't know how to prevent this
		// See details below so you don't have to investicate the whole thing every time.
		_onNotify : function(object, existingId) {
			this.inherited(arguments);

			// if create, refresh current page
			if (object && !existingId) {
				this.gotoPage(this._currentPage);
			}
		},

		// firstArrow: Boolean
		//		Original impl. contains firstLastArrows, but in some cases we want to display only first
		firstArrow : false,

		buildRendering : function() {
			if (this.firstArrow) {
				this.firstLastArrows = true;
			}
			originalBuildRendering.apply(this, arguments);
			if (this.firstArrow) {
				domConstruct.destroy(this.paginationLastNode);
			}
		}
	});

	// Problems we fix and cause with gotoPage in _onNotify
	// 
	// Basic facts:
	// A. When Observable observes a change it computes the index of changed row,
	//    if that index in nonnegative, listeners are called, one of them calls also List._onNotification
	// A1. Observable ignores inserted rows when current page does not start on 0 (e.g. when not on the 1st page)
	// A2. Pagination._onNotification checks if number of rows (on current page) changed and calls gotoPage to refresh
	//
	// B. When Observable observes a change, it calls notify() on store.
	// B1. _StoreMixin._onNotify is aspected to be called after store.notify()
	//
	// Problem with paged dgrid (reported?) 
	// - When new row is added (by store.add) grid, including footer page info is only refreshed if
	//   first page is shown AND that row is present on first page.
	// 
	// Current fix
	// - We force page refresh after new row is added, we use _onNotify that is guaranteend to be called
	//
	// Current problem
	// - When adding row on first page, it is refreshed twice (by _onNotification and _onNotify)
	
});
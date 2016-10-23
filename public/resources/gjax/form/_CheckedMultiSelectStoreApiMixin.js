define([
	"dijit/form/_FormSelectWidget",
	"dojo/_base/array",
	"dojo/when",
	"dojo/_base/lang",
	"dojo/_base/declare"
], function(_FormSelectWidget, array, when, lang, declare) {
	
	//TODO: dojo-doc, unit-test

	var QUERY_SELECTED = {
		// [1] default query for selected items, works fine with assumption of SimpleQueryEngine
		// if another query engine is used, must supply fetchArgs.querySelected
		selected : true
	};
	return declare(null, {
		// experimental support for dojox/form/CheckedMultiSelect and new store API
		setStore : function(store, selectedValue, fetchArgs) {
			// override of CheckedMultiSelect.setStore (original imp. marked)

			//this.inherited(arguments); //unusable, would call checkedMultiSelect.setStore not_FormSelectWidget.setStore !
			_FormSelectWidget.prototype.setStore.apply(this, arguments); //but we are lucky singe root inheritance)

			var setSelectedItems = function(items) { //original, untouched
				var value = array.map(items, function(item) {
					return fetchArgs && fetchArgs.getIdentity && fetchArgs.getIdentity(item) || store.getIdentity(item);
				});
				if (value.length) {
					this.set("value", value);
				}
			};

			// this.store.fetch({query:{selected: true}, onComplete: setSelectedItems, scope: this}); //original

			//[2] extended option, to specify query for selected or use default
			when(this.store.query(fetchArgs && fetchArgs.querySelected || QUERY_SELECTED)) //
			.then(lang.hitch(this, setSelectedItems));

		}
	});

// sample:
//			var keys = [
//				"../../__mocks/agt1YS1wcm9maWxlcnINCxIEVGVzdBi4h88TDA.v3",
//				"../../__mocks/agt1YS1wcm9maWxlcnINCxIEVGVzdBim58kTDA.v3"
//			];
//			var coreStore = new BrowserScope({ //this is ment to be reused by many components on the page
//				keys : keys
//			});
//			
//			var supportStore = lang.delegate(coreStore, { //store just for multiselect checkbox usage, no data duplication
//				queryEngine : rql.query, //just delegate with changed query engine and 
//				idProperty : "test" // changed id property
//			//possibly redefined query, so client widget does not have to bother at all (TODO: testcase)
//			// with specifying query or querySelected
//			});
//			
//			var fullSupportStore = lang.delegate(supportStore, {
//				query : function(query, options) {
//					var queryForSelected = (query && query.selected === true); // naive check for default selected query from _CheckedMultiSelect // {selected:true}
//					query = queryForSelected /*jshint laxbreak:true*/
//					? "recurse(results)&result>0&match(test,Index)&aggregate(test)" //returns selected items
//					: "recurse(results)&result>0&aggregate(test)"; //normal query for items
//					return supportStore.query(query, options);
//				}
//			});
	
//	
//			function usage1(){
//				var chckTestPicker = registry.byId("chckTestPicker1"); //mixed in markup with _CheckedMultiSelectStoreApiMixin.js 
//				chckTestPicker.labelAttr = "test";
//				chckTestPicker.setStore(fullSupportStore);	//selected values and query decided by store
//			}
//			function usage2(){
//				var chckTestPicker = registry.byId("chckTestPicker2"); //mixed in markup with _CheckedMultiSelectStoreApiMixin.js 
//				chckTestPicker.labelAttr = "test";
//				chckTestPicker.setStore(supportStore,["lastIndexOf","substring"],{
//					query : "recurse(results)&result>0&aggregate(test)"
//				}); //selected values explicit by widget
//			}
//			function usage3(){
//				var chckTestPicker = registry.byId("chckTestPicker3"); //mixed in markup with _CheckedMultiSelectStoreApiMixin.js 
//				chckTestPicker.labelAttr = "test";
//				chckTestPicker.setStore(supportStore,null,{ //queries explicit by widget
//						query : "recurse(results)&result>0&aggregate(test)", //this shall be evaluated by _FormSelect	
//						querySelected : "recurse(results)&result>0&match(test,Index)&aggregate(test)" 
//				});
//			}

});

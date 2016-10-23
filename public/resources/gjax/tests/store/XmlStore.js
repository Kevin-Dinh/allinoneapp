/**
 * created 03/07/2014
 *
 * @author marcus
 *
 * @description POC and design of newer methods in gjax.registry
 *
 * This is mostly designed to help understand runtime status of widgets in screen
 * and for writing selenium-driver JS tests
 *
 */
define([
	"require",
	"doh",
	"gjax/xml/X",
	"./lib/XmlStore"
], function(require, doh, X, XmlStore) {

	var dataUrl = require.toUrl("./data/xmlStoreData.xml");

	var testObject = {
		"Created store has correct data length" : function() {
			var store = new XmlStore({
				xmlDoc : X.load(dataUrl),
				itemsXpath : "TransEnv/IndTypeLossList/IndTypeLoss"
			});

			doh.is(12, store.query().length, "unexpected data length");
		},
		"Items have expected properties" : function() {
			var store = new XmlStore({
				xmlDoc : X.load(dataUrl),
				itemsXpath : "TransEnv/IndTypeLossList/IndTypeLoss"
			});

			var firstItem = store.query()[0];
			doh.is("Alzheimer Aladár", firstItem.s_damaged_name);
			doh.is("5511111111", firstItem.s_damaged_id);
			doh.is("INDTYPELOSS_23", firstItem["@ID_INDTYPELOSS"]);
		},
		"Sorting & paging works correctly" : function() {
			var store = new XmlStore({
				xmlDoc : X.load(dataUrl),
				itemsXpath : "TransEnv/IndTypeLossList/IndTypeLoss"
			});

			var data = store.query({}, {
				sort : [
					{
						attribute : "s_damaged_name",
						descending : true
					}
				],
				start : 4, //4x Zúfalec will be skipped
				count : 3
			});
			doh.is(3, data.length, "unexpected length");
			doh.is("Völfl Adam Prokop", data[0].s_damaged_name);
		},
		"Get works correctly" : function() {
			var store = new XmlStore({
				xmlDoc : X.load(dataUrl),
				itemsXpath : "TransEnv/IndTypeLossList/IndTypeLoss",
				idProperty : "@ID_INDTYPELOSS"
			});
			var item = store.get("INDTYPELOSS_23");
			doh.is("Alzheimer Aladár", item.s_damaged_name);
			doh.is("5511111111", item.s_damaged_id);
			doh.is("INDTYPELOSS_23", store.getIdentity(item));
		},
		"Remove works correctly" : function() {
			var store = new XmlStore({
				xmlDoc : X.load(dataUrl),
				itemsXpath : "TransEnv/IndTypeLossList/IndTypeLoss"
			});

			var firstItem = store.query()[0];
			doh.is(firstItem, store.get(firstItem.id), "getting item by id should work");
			doh.is(1, store.query({
				id : firstItem.id
			}).length, "querying item by id should return 1 result");

			store.remove(firstItem.id);

			doh.is(null, store.get(firstItem.id), "getting item by id should return null");
			doh.is(0, store.query({
				id : firstItem.id
			}).length, "querying item by id should return 0 result");
		},
		"Remove correctly updates XML (not implemented)" : function() {
			throw new Error("neither feature nor test implemented yet");
		},
		"Create works correctly" : function() {
			var store = new XmlStore({
				xmlDoc : X.load(dataUrl),
				itemsXpath : "TransEnv/IndTypeLossList/IndTypeLoss"
			});

			doh.is(12, store.query().length, "unexpected data length");

			var newItemXml = X.loadXml("<foo><bar>1</bar></foo>").node("foo");
			var id = store.add(newItemXml);
			doh.is(13, store.query().length, "unexpected data length");
			var newItem = store.get(id);
			doh.is("1", newItem.bar);
			doh.is(newItemXml, newItem._xmlDoc, "original xml should be present on item");
			doh.t(!!newItem.id, "new item should have identity");
		},
		"Update works correctly" : function() {
			var store = new XmlStore({
				xmlDoc : X.load(dataUrl),
				itemsXpath : "TransEnv/IndTypeLossList/IndTypeLoss"
			});

			var firstItem = store.query()[0];
			doh.is("Alzheimer Aladár", firstItem.s_damaged_name);

			var itemXml = firstItem._xmlDoc;
			itemXml.node("s_damaged_name").setText("foo");
			store.put(firstItem);

			firstItem = store.query()[0];
			doh.is("foo", firstItem.s_damaged_name, "s_damaged_name should be updated");
		},
		"Enums resolving" : function() {
			var store = new XmlStore({
				xmlDoc : X.load(dataUrl),
				itemsXpath : "TransEnv/IndTypeLossList/IndTypeLoss",
				enumMappings : {
					nl_indtype_id : "//enumIndTypeList/enumIndType[ID_INDTYPE[text()='${val}']]"
				}
			});

			var firstItem = store.query()[0];
			doh.is("náhrada za bolesť", firstItem.nl_indtype_id_S_DESCRIPT, "enum not resolved");
		}

	};

	// --------------------------------------
	doh.register("gjax/store/XmlStore", testObject);
});

/**
 * created 04/24/2013
 *
 * @author arakovsky
 *
 * @description unit test for module "gjax/store/SchemaStore"
 *
 * @generated by TemplateWizard, v.2012/11/21 //do not remove this comment please
 * @see http://livedocs.dojotoolkit.org/util/doh
 */
define([
	"require",
	"doh",
	"gjax/store/SchemaStore", //TESTED library
	"gjax/uri/Uri",
	"gjax/testing/request/testRequest",
	"gjax/testing/request/rejectWithParams",
	"dojo/request/registry",
	"dojo/_base/lang",
	"dojo/request/util",
	"dojo/Deferred",
	"dojo/when",
	"gjax/error",
	"dojo/_base/array",
	"dojo/promise/all",
	"dojo/json",
	"gjax/XString",
	"gjax/_base/kernel",
	"gjax/rql/template",
	"dojo/_base/config",
	"gjax/request/jsonXhr"
], function(require, doh, SchemaStore, Uri, testRequest, rejectRequest, registry, lang, util, Deferred, when, error, array, all, json, stringUtils, gkernel,
		rqlTemplate, config, jsonXhr) {

	// =============================== STORES =================================
	var PATH_TO_TEST_SMDS = "/_mocks/schemaStore/smds/";
//	var partnerStore = createSampleStore("partner.smd.json");
//	var policyStore = createSampleStore("policy.smd.json");
//	var policy2Store = createSampleStore("policy2.smd.json");
//	var testStore = createSampleStore("test.smd.json");
//	var encodingStore = createSampleStore("encoding.smd.json");
//	//stores with request prop set to testRequest
//	var partnerTestReqStore = createSampleStore("partner.smd.json", true);
//	var policyTestReqStore = createSampleStore("policy.smd.json", true);

	function createSampleStore(smdName, useTestRequest) {
		var params = {
			smd : Uri.resolveSvcCtx(PATH_TO_TEST_SMDS + smdName)
		};
		if (useTestRequest) {
			params.request = testRequest;
		}
		return new SchemaStore(params);
	}

	function isValidSchema(schemaObject) {
		return "$schema" in schemaObject;
	}

	function isSchemaResolved(schemaObject) {
		return "schema" in schemaObject && isValidSchema(schemaObject.schema);
	}
	// ========================================================================

	var testObject = {
		testSmdPathResolving : function() {
			var resolvedUri = Uri.resolveSvcCtx("/xyz/svc/resources/smds/Something.smd.json");
			var s1 = new SchemaStore({
				smd : Uri.resolveSvcCtx("/xyz/svc/resources/smds/Something.smd.json")
			});
			doh.is(resolvedUri, s1.smd);
			var s2 = new SchemaStore({
				smd : "/xyz/svc/resources/smds/Something.smd.json"
			});
			doh.is(resolvedUri, s2.smd);
		},
		testMethodSchemaEnsuring : {
			timeout : 5000,
			runTest : function() {
				var policyStore = createSampleStore("policy.smd.json");
				return policyStore._ensureSchema({})//
				.then(function(smd) {
					return when(policyStore._ensureMethodSchema(smd, "put", false, smd.methods.put[1].techName/*, rqlName*/));
				})//
				.then(function(smd) {
					if (isValidSchema(smd.methods.put[1].schema) //
							&& ("$methodRef" in smd.methods.put[0].schema) //
							&& ("$methodRef" in smd.methods.add[0].schema)) {
						return; //success
					} else {
						throw new Error("Only required put schema should be resolved");
					}
				});
			}
		},
		testMethodsSchemaEnsuring : {
			timeout : 5000,
			runTest : function() {
				var policyStore = createSampleStore("policy.smd.json");
				return policyStore._ensureSchema({})//
				.then(function(smd) {
					return when(policyStore._ensureMethodSchema(smd, "put"));
				})//
				.then(function(smd) {
					if (isValidSchema(smd.methods.put[0].schema) //
							&& isValidSchema(smd.methods.put[1].schema) //
							&& ("$methodRef" in smd.methods.add[0].schema)) {
						return; //success
					} else {
						throw new Error("Put schema should be resolved and add schema should not");
					}
				});
			}
		},
		testCustomMethodSchemaEnsuring : {
			timeout : 5000,
			runTest : function() {
				var policy2Store = createSampleStore("policy2.smd.json");
				var policyStore = createSampleStore("policy.smd.json");
				return policy2Store._ensureSchema({}).then(function(smd) {
					return when(policyStore._ensureMethodSchema(smd, "checkPolicy", true));
				})//
				.then(function(smd) {
					if (isValidSchema(smd.customMethods.checkPolicy.schema)) {
						return; //success
					} else {
						throw new Error("Custom method schema should be resolved");
					}
				});
			}
		},
		testCustomMethodsSchemaEnsuring : {
			timeout : 5000,
			runTest : function() {
				var policy2Store = createSampleStore("policy2.smd.json");
				var policyStore = createSampleStore("policy.smd.json");
				return policy2Store._ensureSchema({}).then(function(smd) {
					return when(policyStore._ensureMethodSchema(smd, "multiCustomSchemaResolving", true));
				})//
				.then(function(smd) {
					var schemas = smd.customMethods.multiCustomSchemaResolving;
					if (!isSchemaResolved(schemas[0])) {
						throw new Error("Custom method schema should be resolved");
					}
					return; //success
				});
			}
		},
		testValidation : function() {
			//dateBegin is required, according to schema
			var policyStore = createSampleStore("policy.smd.json");
			return policyStore.add({})//
			.then(handleUnexpectedSuccess)//
			.otherwise(assertErrMessage("for property dateBegin: is missing and it is required"));
		},
		testFilter : {
			setUp : function() {
				// request concatining "Policy" will go through rejectRequest
				// others (e.g. smd requests) will go through standard request
				this._regiterHandle = registry.register(/data\/Policy/, rejectRequest, true);
			},
			runTest : function() {
				var policyStore = createSampleStore("policy.smd.json");
				return policyStore.add({
					version : 5,
					foo : "bar",
					dateBegin : "2005-10-10"
				})//
				.then(null, gkernel.identity)//
				.then(function(requestParams) {
					//foo is not defined in schema, it should be filtered out
					if (requestParams.data.version == 5 && !("foo" in requestParams.data)) {
						return; //success
					} else {
						throw new Error("Unexpected data being send");
					}
				});
			},
			tearDown : function() {
				//we don't want to spoil other tests
				this._regiterHandle.remove();
			}
		},
		testUnsupportedMethod : function() {
			var policyTestReqStore = createSampleStore("policy.smd.json", true);
			return policyTestReqStore.remove("myId")//
			.then(handleUnexpectedSuccess)//
			.otherwise(assertErrMessage("'remove' method is not supported."));
		},
		testRqlTemplateQuery : {
			setUp : function() {
				this._regiterHandle = registry.register(/data\/Partner/, rejectRequest, true);
			},
			runTest : function() {
				var partnerStore = createSampleStore("partner.smd.json");
				return partnerStore.query({
					foo : "bar",
					ignored : "attribute"
				})//
				.then(null, gkernel.identity)//
				.then(function(requestParams) {
					doh.is("foo=bar&sort(-a)", Uri.getQuery(requestParams.uri), "Unexpected query.");
				});
			},
			tearDown : function() {
				this._regiterHandle.remove();
			}
		},
		testRqlTemplateQueryOptions : {
			setUp : function() {
				this._regiterHandle = registry.register(/data\/Policy/, rejectRequest, true);
			},
			runTest : function() {
				var policyStore = createSampleStore("policy.smd.json");
				return policyStore.query({}, {
					sort : [
						{
							attribute : "paramA"
						}
					],
					_template : "sortTemplate"
				})//
				.then(null, gkernel.identity)//
				.then(function(requestParams) {
					doh.is("sort(+paramA)", Uri.getQuery(requestParams.uri), "Unexpected query.");
				});
			},
			tearDown : function() {
				this._regiterHandle.remove();
			}
		},
		testRqlNamedTemplateQuery : {
			setUp : function() {
				this._regiterHandle = registry.register(/data\/Policy/, rejectRequest, true);
			},
			runTest : function() {
				var policyStore = createSampleStore("policy.smd.json");
				return policyStore.query({
					foo : "bar",
					ignored : "attribute"
				}, {
					_template : "fooTemplate"
				})//
				.then(null, gkernel.identity)//
				.then(function(requestParams) {
					doh.is("foo=bar&sort(-a)", Uri.getQuery(requestParams.uri), "Unexpected query.");
				});
			},
			tearDown : function() {
				this._regiterHandle.remove();
			}
		},
		testRqlNamedTemplateNoQuery : {
			setUp : function() {
				this._regiterHandle = registry.register(/data\/Policy/, rejectRequest, true);
			},
			runTest : function() {
				var policyStore = createSampleStore("policy.smd.json");
				return policyStore.query()//
				.then(null, gkernel.identity)//
				.then(function(requestParams) {
					doh.is(null, Uri.getQuery(requestParams.uri), "Unexpected query.");
				});
			},
			tearDown : function() {
				this._regiterHandle.remove();
			}
		},
		testRqlTemplateGet : {
			setUp : function() {
				this._regiterHandle = registry.register(/data\/Policy/, rejectRequest, true);
			},
			runTest : function() {
				var testStore = createSampleStore("test.smd.json");
				return testStore.get(6, {
					query : {
						foo : "bar",
						ignored : "attribute"
					}
				})//
				.then(null, gkernel.identity)//
				.then(function(requestParams) {
					doh.is("foo=bar", Uri.getQuery(requestParams.uri), "Unexpected query.");
				});
			},
			tearDown : function() {
				this._regiterHandle.remove();
			}
		},
		testRqlNamedTemplateQueryGet : {
			setUp : function() {
				this._regiterHandle = registry.register(/data\/Policy/, rejectRequest, true);
			},
			runTest : function() {
				var policyStore = createSampleStore("policy.smd.json");
				return policyStore.get(6, {
					query : {
						foo : "bar",
						ignored : "attribute"
					},
					_template : "fooTemplate"
				})//
				.then(null, gkernel.identity)//
				.then(function(requestParams) {
					doh.is("foo=bar", Uri.getQuery(requestParams.uri), "Unexpected query.");
				});
			},
			tearDown : function() {
				this._regiterHandle.remove();
			}
		},
		testRqlNamedTemplateNoQueryGet : {
			setUp : function() {
				this._regiterHandle = registry.register(/data\/Policy/, rejectRequest, true);
			},
			runTest : function() {
				var policyStore = createSampleStore("policy.smd.json");
				return policyStore.get(6)//
				.then(null, gkernel.identity)//
				.then(function(requestParams) {
					doh.is(null, Uri.getQuery(requestParams.uri), "Unexpected query.");
				});
			},
			tearDown : function() {
				this._regiterHandle.remove();
			}
		},
		testGet : function() {
			var policyTestReqStore = createSampleStore("policy.smd.json", true);
			return policyTestReqStore//
			.get({ // this is not implemented!
				policyId : 123,
				otherId : 456
			})//
			.then(function(obj) {
				if (obj.policyId == 123 && obj.otherId == 456 && obj.a == 1) {
					return; //success
				} else {
					throw new Error("invalid obj:" + json.stringify(obj));
				}
			});
		},
		testTotal : function() {
			var policyTestReqStore = createSampleStore("policy.smd.json", true);
			var policiesPromise = policyTestReqStore.query();
			return policiesPromise.total//
			.then(function(total) {
				doh.is(10, total, "Invalid total");
			});
		},
		testSubordinateQuery : function() {
			var policyTestReqStore = createSampleStore("policy.smd.json", true);
			return policyTestReqStore.query()//
			.then(function(policies) {
				return policyTestReqStore.getSubStore("Version", policies[0]);
			})//
			.then(function(versionStore) {
				return versionStore.query();
			})//
			.then(function(versions) {
				if (versions.length == 2 && versions[0].versionId == 1) {
					return; //success
				}
				throw new Error("Invalid result");
			});

		},
		testQueryRequired : function() {
			var policyTestReqStore = createSampleStore("policy.smd.json", true);
			return policyTestReqStore.query()//
			.then(function(policies) {
				return policyTestReqStore.getSubStore("Intervention", policies[0]);
			})//
			.then(function(versionStore) {
				return versionStore.query();
			})//

			.then(handleUnexpectedSuccess)//
			.otherwise(assertErrMessage("Empty query not allowed."));
		},
		testGetSubordinateStoreByIdentity : function() {
			var policyTestReqStore = createSampleStore("policy.smd.json", true);
			var policyStore = createSampleStore("policy.smd.json");
			return policyTestReqStore.query()//
			.then(function(policies) {
				var policyIdentity = policyStore.getIdentity(policies[0]);
				return policyTestReqStore.getSubStore("Version", policyIdentity);
			})//
			.then(function(versionStore) {
				return versionStore.query();
			})//
			.then(function(versions) {
				if (versions.length == 2 && versions[0].versionId == 1) {
					return;//success
				}
				throw new Error("Invalid result");
			});

		},
		testLazySubordinateQuery : function() {
			var partnerTestReqStore = createSampleStore("partner.smd.json", true);
			return partnerTestReqStore.query({
				foo : "bar"
			})//
			.then(function(partners) {
				return partnerTestReqStore.getSubStore("Policy", partners[0]);
			})//
			.then(function(policyStore) {
				return policyStore.query();
			})//
			.then(function(policies) {
				if (policies.length == 2 && policies[0].policyId == 123) {
					return;//success
				}
				throw new Error("Invalid result");
			});

		},
		testLazySubordinateWithoutParent : function() {
			// we have identity already, no need to load partner
			var partnerTestReqStore = createSampleStore("partner.smd.json", true);
			var partnerIdentity = "ssn=8706041234;personalId=123456";
			return partnerTestReqStore.getSubStore("Policy", partnerIdentity)//
			.then(function(policyStore) {
				return policyStore.query();
			})//
			.then(function(policies) {
				if (policies.length == 2 && policies[0].policyId == 123) {
					return; //succes
				}
				throw new Error("Invalid result");
			});

		},
		testSingleSubordinateGet : function() {
			var policyTestReqStore = createSampleStore("policy.smd.json", true);
			return policyTestReqStore.query()//
			.then(function(policies) {
				return policyTestReqStore.getSubStore("Storno", policies[0]);
			})//
			.then(function(stornoStore) {
				return stornoStore.get();
			})//
			.then(function(storno) {
				if (storno.storno === true) {
					return; //succes
				}
				throw new Error("Invalid result");
			});
		},
		testSingleSubordinateSubordinate : function() {
			var policyTestReqStore = createSampleStore("policy.smd.json", true);
			return policyTestReqStore.query()//
			.then(function(policies) {
				return policyTestReqStore.getSubStore("Storno", policies[0]);
			})//
			.then(function(stornoStore) {
				return stornoStore.getSubStore("Status");
			})//
			.then(function(statusStore) {
				return statusStore.query();
			})
			.then(function(statuses) {
				if (statuses.length == 2) {
					return;
				}
				throw new Error("Invalid result");
			});
		},

		// tested functionality not implemented
//		testPutSendIdAttributes : {
//			setUp : function() {
//				this._regiterHandle = registry.register(/data\/Policy/, rejectRequest, true);
//			},
//			runTest : function() {
//				var obj = {
//					policyId : 123,
//					otherId : 321,
//					version : 6,
//					dateBegin : "2005-10-10",
//					// this would come from store
//					_identity : "policyId=123;otherId=321"
//				};
//
//				return policyStore.put(obj)//
//				.then(null, gkernel.identity)//
//				.then(function(requestParams) {
//					doh.f("policyId" in requestParams.data || "otherId" in requestParams.data, //
//					"id properties present in payload!");
//				});
//			},
//			tearDown : function() {
//				this._regiterHandle.remove();
//			}
//		},

		testPutSendIdAttributesTrue : {
			setUp : function() {
				this._regiterHandle = registry.register(/data\/Policy/, rejectRequest, true);
			},
			runTest : function() {
				var obj = {
					policyId : 123,
					otherId : 321,
					version : 6,
					dateBegin : "2005-10-10",
					// this would come from store
					_identity : "policyId=123;otherId=321"
				};

				var policyStore = createSampleStore("policy.smd.json");
				policyStore.sendIdAttributes = true;

				return policyStore.put(obj)//
				.then(null, gkernel.identity)//
				.then(function(requestParams) {
					doh.t("policyId" in requestParams.data && "otherId" in requestParams.data, //
					"id properties not present in payload!");
				});
			},
			tearDown : function() {
				this._regiterHandle.remove();
			}
		},
		testMethodRef : function() {
			var policyTestReqStore = createSampleStore("policy.smd.json", true);
			return policyTestReqStore.add({
				dateBegin : 1
			})//
			.then(handleUnexpectedSuccess)//
			.otherwise(assertErrMessage("for property dateBegin: number value found, but a string is required"));
		},
		testCustomPostMethodCall : {
			setUp : function() {
				this._regiterHandle = registry.register(/data\/Policy/, rejectRequest, true);
			},
			runTest : function() {
				var policy2Store = createSampleStore("policy2.smd.json");
				return policy2Store.callCustom("checkPolicy", "policyId=123;otherId=456", {
					dateBegin : "2005-10-10"
				})//
				.then(null, gkernel.identity)//
				.then(function(requestParams) {
					doh.is("post", requestParams.method, "Unexpected method.");
					if (!("data" in requestParams) || !requestParams.data.dateBegin) {
						throw new Error("dateBegin property expected");
					}
					var parts = requestParams.uri.split(/(?!^)\/(?!$)/), l = parts.length;
					if (l < 3 || parts[l - 1] !== "checkPolicy" || parts[l - 2] !== "policyId=123;otherId=456" || parts[l - 3] !== "Policy") {
						throw new Error("'/Policy/policyId=123;otherId=456/checkPolicy' uri expected.");
					}

					return; //success
				});
			},
			tearDown : function() {
				this._regiterHandle.remove();
			}
		},
		testCustomGetMethodCall : {
			setUp : function() {
				this._regiterHandle = registry.register(/data\/Policy/, rejectRequest, true);
			},
			runTest : function() {
				var policy2Store = createSampleStore("policy2.smd.json");
				return policy2Store.callCustom("toCheckList", "policyId=123;otherId=456", {
					partId : 123
				}, {
					_template : "default"
				})//
				.then(null, gkernel.identity)//
				.then(function(requestParams) {
					doh.is("get", requestParams.method, "Unexpected method.");
					var parts = requestParams.uri.split(/(?!^)\/(?![\?$])/), l = parts.length;
					if (l < 3 || parts[l - 1] !== "toCheckList/?partId=123" //
							|| parts[l - 2] !== "policyId=123;otherId=456"//
							|| parts[l - 3] !== "Policy") {
						throw new Error("'/Policy/policyId=123;otherId=456/toCheckList/?partId=123' uri expected.");
					}

					return; //success
				});
			},
			tearDown : function() {
				this._regiterHandle.remove();
			}
		},
		testCustomMethodWithMultipleInFiles : {
			setUp : function() {
				this._regiterHandle = registry.register(/data\/Policy/, rejectRequest, true);
			},
			runTest : function() {
				var policy2Store = createSampleStore("policy2.smd.json");
				return policy2Store.callCustom("multiCustom", "policyId=123;otherId=456", {
					partId : 123
				}, {
					_method : "delete"
				})//
				.then(null, gkernel.identity)//
				.then(function(requestParams) {
					doh.is("delete", requestParams.method, "Unexpected method.");
					var parts = requestParams.uri.split(/(?!^)\/(?![\?$])/), l = parts.length;
					if (l < 3 || parts[l - 1] !== "multiCustom?partId=123" || parts[l - 2] !== "policyId=123;otherId=456" || parts[l - 3] !== "Policy") {
						throw new Error("'/Policy/policyId=123;otherId=456/multiCustom?partId=123' uri expected.");
					}
					return; //success
				});
			},
			tearDown : function() {
				this._regiterHandle.remove();
			}
		},
		testCustomMethodWithMultipleInFilesForSameMethod : {
			setUp : function() {
				this._regiterHandle = registry.register(/data\/Policy/, rejectRequest, true);
			},
			runTest : function() {
				var policy2Store = createSampleStore("policy2.smd.json");
				return policy2Store.callCustom("multiCustom", "policyId=123;otherId=456", {
					partId : 123
				}, {
					_method : "get",
					_template : "foo"
				})//
				.then(null, gkernel.identity)//
				.then(function(requestParams) {
					doh.is("get", requestParams.method, "Unexpected method.");
					var parts = requestParams.uri.split(/(?!^)\/(?![\?$])/), l = parts.length;
					if (l < 3 || parts[l - 1] !== "multiCustom/?foo()" || parts[l - 2] !== "policyId=123;otherId=456" || parts[l - 3] !== "Policy") {
						throw new Error("'/Policy/policyId=123;otherId=456/multiCustom/?foo()' uri expected.");
					}
					return; //success
				});
			},
			tearDown : function() {
				this._regiterHandle.remove();
			}
		},
		testCustomMethod_Self : {
			setUp : function() {
				this._regiterHandle = registry.register(/data\/Policy/, rejectRequest, true);
			},
			runTest : function() {
				var policy2Store = createSampleStore("policy2.smd.json");
				return policy2Store.callCustom("_self", "456789", {}, {
					_template : "default",
					query : {//for POST we must send query in options
						queryParam : "foo"
					}
				})//
				.then(null, gkernel.identity)//
				.then(function(requestParams) {
					doh.is("post", requestParams.method, "Unexpected method.");
					if (!stringUtils.endsWith(requestParams.uri, "/Policy/456789?queryParam=foo")) {
						throw new Error("'/Policy/456789?queryParam=foo' uri ending expected.");
					}
					return; //success
				});
			},
			tearDown : function() {
				this._regiterHandle.remove();
			}
		},
		testNamesGet : {
			setUp : function() {
				this._regiterHandle = registry.register(/data\/Policy/, rejectRequest, true);
			},
			runTest : function() {
				var policyStore = createSampleStore("policy.smd.json");
				return policyStore.get(1)//
				.then(null, gkernel.identity)//
				.then(function(requestParams) {
					doh.is("GetPolicy", requestParams.options.techName, "Unexpected techName.");
					doh.is("Get Policy", requestParams.options.displayName, "Unexpected display name.");
				});
			},
			tearDown : function() {
				this._regiterHandle.remove();
			}
		},
		testNamesAdd : {
			setUp : function() {
				this._regiterHandle = registry.register(/data\/Policy/, rejectRequest, true);
			},
			runTest : function() {
				var policyStore = createSampleStore("policy.smd.json");
				return policyStore.add({
					dateBegin : "2005-10-10"
				})//
				.then(null, gkernel.identity)//
				.then(function(requestParams) {
					doh.is("AddPolicy", requestParams.options.techName, "Unexpected techName.");
					doh.is("Add Policy", requestParams.options.displayName, "Unexpected display name.");
				});
			},
			tearDown : function() {
				this._regiterHandle.remove();
			}
		},
		testNamesQuery : {
			setUp : function() {
				this._regiterHandle = registry.register(/data\/Policy/, rejectRequest, true);
			},
			runTest : function() {
				var policyStore = createSampleStore("policy.smd.json");
				var firstResult = policyStore.query()//
				.then(null, gkernel.identity)//
				.then(function(requestParams) {
					doh.is("SearchPolicy", requestParams.options.techName, "Unexpected techName.");
					doh.is("Search Policy", requestParams.options.displayName, "Unexpected display name.");
				});

				var secondResult = policyStore.query({
					clientId : 5
				}, {
					_template : "client"
				})//
				.then(null, gkernel.identity)//
				.then(function(requestParams) {
					doh.is("SearchPolicyByClient", requestParams.options.techName, "Unexpected techName.");
					doh.is("Search Policy By Client", requestParams.options.displayName, "Unexpected display name.");
				});

				return all([
					firstResult,
					secondResult
				]);
			},
			tearDown : function() {
				this._regiterHandle.remove();
			}
		},
		testIdEncondingGet : {
			setUp : function() {
				this._regiterHandle = registry.register(/data\/EncodedIdsTest/, rejectRequest, true);
			},
			runTest : function() {
				var encodingStore = createSampleStore("encoding.smd.json");
				return encodingStore.get("a/b?c#d")//
				.then(null, gkernel.identity)//
				.then(function(requestParams) {
					doh.is(Uri.resolveSvcCtx("/_mocks/schemaStore/data/EncodedIdsTest/a%2Fb%3Fc%23d"), requestParams.uri, "Unexpected uri.");
				});
			},
			tearDown : function() {
				this._regiterHandle.remove();
			}
		},
		testIdNumberEncondingGet : {
			setUp : function() {
				this._regiterHandle = registry.register(/data\/EncodedIdsTest/, rejectRequest, true);
			},
			runTest : function() {
				var encodingStore = createSampleStore("encoding.smd.json");
				return encodingStore.get(123)//
				.then(null, gkernel.identity)//
				.then(function(requestParams) {
					doh.is(Uri.resolveSvcCtx("/_mocks/schemaStore/data/EncodedIdsTest/123"), requestParams.uri, "Unexpected uri.");
				});
			},
			tearDown : function() {
				this._regiterHandle.remove();
			}
		},
		testIdEncondingMatrixGet : {
			setUp : function() {
				this._regiterHandle = registry.register(/data\/EncodedIdsTest/, rejectRequest, true);
			},
			runTest : function() {
				var identity = {
					superId : "??",
					hyperId : "2006/12/12"
				};
				var encodingStore = createSampleStore("encoding.smd.json");
				return encodingStore.get(identity)//
				.then(null, gkernel.identity)//
				.then(
						function(requestParams) {
							doh.is(Uri.resolveSvcCtx("/_mocks/schemaStore/data/EncodedIdsTest/superId=%3F%3F;hyperId=2006%2F12%2F12"), requestParams.uri,
									"Unexpected uri.");
						});
			},
			tearDown : function() {
				this._regiterHandle.remove();
			}
		},
		testIdEncondingPut : {
			setUp : function() {
				this._regiterHandle = registry.register(/data\/EncodedIdsTest/, rejectRequest, true);
			},
			runTest : function() {
				var obj = {
					id : "a/b?c#d",
					version : 2
				};
				var encodingStore = createSampleStore("encoding.smd.json");
				return encodingStore.put(obj, {
					id : obj.id
				// when obj is out of store and method is put, use options with id
				})//
				.then(null, gkernel.identity)//
				.then(function(requestParams) {
					doh.is(Uri.resolveSvcCtx("/_mocks/schemaStore/data/EncodedIdsTest/a%2Fb%3Fc%23d"), requestParams.uri, "Unexpected uri.");
				});
			},
			tearDown : function() {
				this._regiterHandle.remove();
			}
		},
		testIdEncondingDelete : {
			setUp : function() {
				this._regiterHandle = registry.register(/data\/EncodedIdsTest/, rejectRequest, true);
			},
			runTest : function() {
				var encodingStore = createSampleStore("encoding.smd.json");
				return encodingStore.remove("a/b?c#d")//
				.then(null, gkernel.identity)//
				.then(function(requestParams) {
					doh.is(Uri.resolveSvcCtx("/_mocks/schemaStore/data/EncodedIdsTest/a%2Fb%3Fc%23d"), requestParams.uri, "Unexpected uri.");
				});
			},
			tearDown : function() {
				this._regiterHandle.remove();
			}
		},
		testIdEncondingCallCustom : {
			setUp : function() {
				this._regiterHandle = registry.register(/data\/EncodedIdsTest/, rejectRequest, true);
			},
			runTest : function() {
				var encodingStore = createSampleStore("encoding.smd.json");
				return encodingStore.callCustom("Import", "a/b?c#d", {})//
				.then(null, gkernel.identity)//
				.then(function(requestParams) {
					doh.is(Uri.resolveSvcCtx("/_mocks/schemaStore/data/EncodedIdsTest/a%2Fb%3Fc%23d/Import"), requestParams.uri, "Unexpected uri.");
				});
			},
			tearDown : function() {
				this._regiterHandle.remove();
			}
		},
		testIdEncondingSubstore : {
			setUp : function() {
				this._regiterHandle = registry.register(/data.*\/Version/, rejectRequest, true);
			},
			runTest : function() {
				var encodingStore = createSampleStore("encoding.smd.json");
				return encodingStore.getSubStore("Version", "a/b?c#d")//
				.then(function(substore) {
					return substore.get("???");
				})//
				.then(null, gkernel.identity)//
				.then(function(requestParams) {
					doh.is(Uri.resolveSvcCtx("/_mocks/schemaStore/data/EncodedIdsTest/a%2Fb%3Fc%23d/Version/%3F%3F%3F"), requestParams.uri, "Unexpected uri.");
				});
			},
			tearDown : function() {
				this._regiterHandle.remove();
			}
		},

		"Original get subordinate store still works" : function() {
			var partnerTestReqStore = createSampleStore("partner.smd.json", true);
			return partnerTestReqStore.getSubStore("Address", 148)//
			.then(function(store) {
				doh.is(store._target, Uri.resolveSvcCtx("/_mocks/schemaStore/data/Partner/148/Address/"), "Unexpected store");
			});
		},

		"Never empty query" : {
			setUp : function() {
				this._regiterHandle = registry.register(/data\/Policy/, rejectRequest, true);
			},
			runTest : function() {
				// query method do not require 'fake query' anymore
				var policyStore = createSampleStore("policy.smd.json");
				return policyStore.query({}, {
					_template : "activeOnlyTemplate" // "activeOnly()[&sort(*)]"
				})//
				.then(null, gkernel.identity)//
				.then(function(requestParams) {
					doh.is("SearchActiveOnlyPolicy", requestParams.options.techName, "Unexpected techName.");
					doh.is("Search Active Policy", requestParams.options.displayName, "Unexpected display name.");
					doh.is("activeOnly()", Uri.getQuery(requestParams.uri), "Unexpected query.");
				});
			},
			tearDown : function() {
				this._regiterHandle.remove();
			}
		},

		"Empty query (options) object" : {
			setUp : function() {
				this._regiterHandle = registry.register(/data\/Policy/, rejectRequest, true);
			},
			runTest : function() {
				var policyStore = createSampleStore("policy.smd.json");
				return policyStore.query({}, {
					_template : "stateTemplate" // [&state(*)?&sort(*)]
				})//
				.then(null, gkernel.identity)//
				.then(function(requestParams) {
					doh.is("SearchPolicyByState", requestParams.options.techName, "Unexpected techName.");
					doh.is("Search State Policy", requestParams.options.displayName, "Unexpected display name.");
					doh.is("", Uri.getQuery(requestParams.uri), "Unexpected query.");
				});
			},
			tearDown : function() {
				this._regiterHandle.remove();
			}
		},

		"Non existing template" : function() {
			var policyStore = createSampleStore("policy.smd.json");
			return policyStore.query({}, {
				_template : "nonExistingTemplate"
			})//
			.then(handleUnexpectedSuccess)//
			.otherwise(assertErrMessage("Query definition for template 'nonExistingTemplate' could not be found."));
		},

		"Custom query" : {
			setUp : function() {
				this._regiterHandle = registry.register(/data\/Policy/, rejectRequest, true);
				// must register custom unary operator
				rqlTemplate.unaryOperators.push("state");
			},
			runTest : function() {
				var policyStore = createSampleStore("policy.smd.json");
				return policyStore.query({
					state : "active"
				}, {
					_template : "stateTemplate" // [&state(*)?&sort(*)]
				})//
				.then(null, gkernel.identity)//
				.then(function(requestParams) {
					doh.is("SearchPolicyByState", requestParams.options.techName, "Unexpected techName.");
					doh.is("Search State Policy", requestParams.options.displayName, "Unexpected display name.");
					doh.is("state(active)", Uri.getQuery(requestParams.uri), "Unexpected query.");
				});
			},
			tearDown : function() {
				this._regiterHandle.remove();
			}
		}
	};

	// --------------------------------------

	function assertErrMessage(message) {
		return function(err) {
			if (err.message == message) {
				return; //success
			}
			throw new Error("Unexpected error message: '" + err.message + "' Expecting: '" + message + "'");

		};
	}

	function handleUnexpectedSuccess(result) {
		throw new Error("Error callback expected, but succes callback called with result" + json.stringify(result));
	}

	var regHandler;
	var origSvcCtxPrefix = config.svcCtxPrefix;
	doh.register("gjax/store/SchemaStore", testObject, function() {
		//SETUP
		regHandler = registry.register(/.*/, jsonXhr);
		var CTX_PREFIX = Uri.getPath(Uri.resolve(null, require.toUrl("."))); //set path to this test's folder as ctx prefix, so paths to (and in) smd may be root relative to this folder
		config.svcCtxPrefix = CTX_PREFIX;
	}, function() {
		//TEAR DOWN
		regHandler.remove();
		config.svcCtxPrefix = origSvcCtxPrefix;
	});
});
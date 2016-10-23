define([
	"build/messages"
], function(messages) {

//			info:[[100, 199]],
//			warn:[[200, 299]],
//			error:[[300, 399]],
//			report:[[400, 499]]
// 			start on *80 for GJAX

	messages.addMessage(1, 180, "cssIncluded",
			"'xstyle/css' (gjax plugin): Stub for css included. This modules must be loaded manualy. Xstyle plugin will ignore them.", false);
	messages.addMessage(1, 181, "cssNotIncluded", "'xstyle/css' (gjax plugin): Stub for css NOT included. This modules will be loaded by plugin.", false);
	messages.addMessage(1, 182, "gnlsLayerCreated", "gjax/build/transforms/buildGnlsLayers: Created layer for 'gnls'.", false);
	messages.addMessage(1, 183, "jspxTransform-succes", "JSPX transform: Successfully transformed to HTML.", false);
	messages.addMessage(1, 184, "filteredReport", "Filtered reports.", false);

	messages.addMessage(1, 280, "jspxTransform-missingLocalization", "JSPX transform: Missing localization for transformed HTML.", false);

	messages.addMessage(1, 380, "jspxTransform-svcFail", "JSPX transform: transform service failed.", false);
	messages.addMessage(1, 381, "jspxTransform-htmlWriteError", "JSPX transform: HTML could not be written.", false);
	
	return messages;
});

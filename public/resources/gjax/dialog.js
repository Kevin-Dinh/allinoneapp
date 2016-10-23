define([
	"dojo/Deferred",
	"gjax/dialog/Dialog"
], function(Deferred, Dialog) {

	// module:
	//		gjax/dialog
	// summary:
	//		Provides convenient methods for opening most common information dialogs.

	function info(title, message) {
		// summary:
		//		Use to open info dialog. Has one Ok button.
		// title: String
		//		Dialog title.
		// message: String
		//		Message shown in dialog body.
		// returns: dojo/Deferred
		//		Promise with return value.
		return showDialog({
			type : "info",
			message : message,
			title : title
		});
	}

	function success(title, message) {
		// summary:
		//		Use to open info dialog. Has one Ok button.
		// title: String
		//		Dialog title.
		// message: String
		//		Message shown in dialog body.
		// returns: dojo/Deferred
		//		Promise with return value.
		return showDialog({
			type : "success",
			message : message,
			title : title
		});
	}

	function warning(title, message, bugReport) {
		// summary:
		//		Use to open warning dialog. Has one Ok button. Optionaly shows a bug report too.
		// title: String
		//		Dialog title.
		// message: String
		//		Message shown in dialog body.
		// bugReport: String?
		//		Bug report to show in extra panel.
		// returns: dojo/Deferred
		//		Promise with return value.
		return showDialog({
			type : "warning",
			message : message,
			bugReport : bugReport,
			title : title
		});
	}

	function error(title, message, bugReport) {
		// summary:
		//		Use to open error dialog. Has one Ok button. Optionaly shows a bug report too.
		// title: String
		//		Dialog title.
		// message: String
		//		Message shown in dialog body.
		// bugReport: String?
		//		Bug report to show in extra panel.
		// returns: dojo/Deferred
		//		Promise with return value.
		return showDialog({
			type : "error",
			message : message,
			bugReport : bugReport,
			title : title
		});
	}

	function question(title, message, defaultAction) {
		// summary:
		//		Use to open question dialog. Has Yes and No buttons.
		// title: String
		//		Dialog title.
		// message: String
		//		Message shown in dialog body.
		// returns: dojo/Deferred
		//		Promise with return value.
		return showDialog({
			type : "question",
			message : message,
			okBtnDisplayed : false,
			yesBtnDisplayed : true,
			noBtnDisplayed : true,
			title : title,
			defaultAction : defaultAction
		});
	}

	function showDialog(config) {
		// summary:
		//		Use to open custom dialog. May have various combination of buttons.
		// config: Object
		//		Dialog config object.
		// returns: dojo/Deferred
		//		Promise with return value.
		// example:
		//	|	showDialog({
		//	|		type : "error",
		//	|		message : msgs.errUnexpectedErrorHasOccured,
		//	|		bugReport : bugReport,
		//	|		title : msgs.errUnexpectedError,
		//	|		okBtnDisplayed : true,
		//	|		cancelBtnDisplayed : false,
		//	|		yesBtnDisplayed : true,
		//	|		noBtnDisplayed : true,
		//	|		okBtnLabel : msgs.cancel,
		//	|		noBtnLabel : msgs.reload,
		//	|	}).then(function(result) {
		//	|		console.debug(result);
		//	|	});
		var def = new Deferred();
		var dialog = new Dialog(config);
		dialog.startup();
		dialog.show();

		dialog.own(dialog.on("close", function(val) {
			def.resolve(val);
			dialog.destroyRecursive();
		}));

		return def;
	}

	return {
		// summary:
		//		Provides convenient methods for opening most common information dialogs.
		// description:
		//		All methods return promise that resolves with dialog return value.
		warning : warning,
		info : info,
		success : success,
		question : question,
		error : error,
		custom : showDialog
	};
});

define([
	"gjax/encoding/base64"
], function(base64) {
	
	// IE Xhr does not support datauri (ends up with access denied with any security config I have tried)
	// but it supports 'blob uri', see:	
	//		https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL
	//		https://github.com/fengyuanchen/cropper/issues/540
	//		http://stackoverflow.com/questions/16245767/creating-a-blob-from-a-base64-string-in-javascript

	function xmlToObjectUrl(xml) {
		/*global URL:true */
		return URL.createObjectURL(b64toBlob(base64.encode(xml), "application/xml"));
	}

	function b64toBlob(b64Data, contentType, sliceSize) {
		contentType = contentType || '';
		sliceSize = sliceSize || 512;

		var byteCharacters = atob(b64Data);
		var byteArrays = [];

		for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
			var slice = byteCharacters.slice(offset, offset + sliceSize);

			var byteNumbers = new Array(slice.length);
			for (var i = 0; i < slice.length; i++) {
				byteNumbers[i] = slice.charCodeAt(i);
			}

			var byteArray = new Uint8Array(byteNumbers);

			byteArrays.push(byteArray);
		}

		var blob = new Blob(byteArrays, {
			type : contentType
		});
		return blob;
	}

	return xmlToObjectUrl;
});
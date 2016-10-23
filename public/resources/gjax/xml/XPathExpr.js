define([], function() {

	//TODO: no doh tests yet

	var XPathExpr = {};
	/**
	replaces VariableReference with values specified in varObj
	if VariableReference reference not found throws Error("unresolved VariableReference");
	@param strXPath
	$var = represents variavble
	'$var' = DOES NOT represent variable but string (pozor na spaces !!!)
	"$var" = DOES NOT represent variable but string

	@param varObj
	{var:number,var1:string}
	if ouher type - Error("unsupportsed Variable type")
	@return string representing escaped expression
	@author: zagora
	**/
	XPathExpr.compile = function(strXPath, varObj) {
		if (varObj == null) {
			return strXPath;
		}
		var m, sb = [];
		do {
			m = strXPath.match(/(\$[A-Za-z0-9]*)/);
			if (m == null) {
				sb.push(strXPath);
				break;
			}
			var escapePos = 0;
			if (_XPathExpr_isEscaped(m) == null) {
				sb.push(strXPath.substring(0, m.index));
				var varName = m[0].substring(1); //without $ char
				if (typeof varObj[varName] == "string") {
					var i, l = 0, cd, a = varObj[varName].split("'").length, b = varObj[varName].split('"').length;
					cd = a > b ? '"' : "'";
					if (a == 1 || b == 1) {
						sb.push(cd + varObj[varName] + cd);
						strXPath = strXPath.substring(m.index + m[0].length);
						continue;
					}
					sb.push("concat(" + cd);
					do {
						i = varObj[varName].indexOf(cd, l);
						if (i != -1) {
							sb.push(varObj[varName].substring(l, i) + cd);
							cd = (cd == "'") ? '"' : "'";
							sb.push("," + cd);
							l = i;
						} else {
							sb.push(varObj[varName].substring(l) + cd + ")");
						}
					} while (i != -1);
				} else if (typeof varObj[varName] == "number") {
					sb.push(varObj[varName]);
				} else {
					throw new Error("unsupportsed data type in XPathExpr.compile: " + typeof varObj[varName]);
				}
			} else //escaped
			{
				var escapeChar = _XPathExpr_isEscaped(m);
				escapePos = m.input.substring(m.index + m[0].length).indexOf(escapeChar) + 1;
				sb.push(m.input.substring(0, m.index + m[0].length + escapePos));
			}
			strXPath = m.input.substring(m.index + m[0].length + escapePos);
		} while (m != null);
		return sb.join("");
	};
	/*
	return escape character (' or ")
	or null if not escaped
	@author: zagora
	Private: TODO: nicer design, not module scope [marcus]
	*/
	function _XPathExpr_isEscaped(regExpResult) {
		var partLeft = regExpResult.input.substring(0, regExpResult.index), inSimpleQuotes = false, inDoubleQuotes = false, i, c;
		for (i = 0; i < partLeft.length; i++) {
			c = partLeft.charAt(i);
			if (c == '"' && !inSimpleQuotes && !inDoubleQuotes) {
				inDoubleQuotes = true;
				continue;
			}
			if (c == "'" && !inSimpleQuotes && !inDoubleQuotes) {
				inSimpleQuotes = true;
				continue;
			}
			if (c == '"' && inDoubleQuotes) {
				inDoubleQuotes = false;
				continue;
			}
			if (c == "'" && inSimpleQuotes) {
				inSimpleQuotes = false;
				continue;
			}
		}

		if (inSimpleQuotes) {
			return "'";
		} else if (inDoubleQuotes) {
			return '"';
		}
		return null;
	}

	/*
	metoda vyraba relativnu cestu z basePath a refPath
	priklad: relativize("a/b", "a/b/c/d") = "c/d"
	*/
	XPathExpr.relativize = function(basePath, refPath) {
		if (refPath.indexOf(basePath) === 0) {
			return refPath.substr(basePath.length + 1);
		} else {
			console.warn("WARNING: XPathExpr.relativize - refPath doesn't start with basePath - returning full refPath");
			return refPath;
		}
	};
	/*
	metoda vyraba absolutnu cestu z basePath a refPath
	priklad: resolve("a/b", "c/d") = "a/b/c/d"
	*/
	XPathExpr.resolve = function(basePath, refPath) {
		return basePath.concat("/", refPath);
	};
	// export supports
	return XPathExpr;
});

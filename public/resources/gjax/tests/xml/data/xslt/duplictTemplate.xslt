<?xml version="1.0" encoding="UTF-8" ?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:template name="a">a1</xsl:template>
	<xsl:template name="a">a2</xsl:template>
	<xsl:template match="/">
		<test>
			<xsl:call-template name="a"></xsl:call-template>
		</test>
	</xsl:template>
</xsl:stylesheet>

  
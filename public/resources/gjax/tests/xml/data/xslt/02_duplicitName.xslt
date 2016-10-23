<?xml version="1.0" encoding="UTF-8" ?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:include href="./a/a.xslt"/>
<xsl:include href="./a/1/a.xslt"/>
<xsl:output method="xml"></xsl:output>
<xsl:template match="/">
	<test>
		<xsl:call-template name="a"></xsl:call-template>
		<xsl:call-template name="a1"></xsl:call-template>
	</test>
</xsl:template>
</xsl:stylesheet>

  

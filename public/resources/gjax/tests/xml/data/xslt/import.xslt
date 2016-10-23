<?xml version="1.0" encoding="UTF-8" ?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:import href="imported.xslt"/>
<xsl:output method="xml"></xsl:output>
<xsl:template match="/">
	<test>
		<xsl:call-template name="imported"></xsl:call-template>
	</test>
</xsl:template>
</xsl:stylesheet>

  

<?xml version="1.0" encoding="UTF-8" ?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:output method="xml"></xsl:output> 
<xsl:template match="/">
	<xsl:copy-of select="document('test01.xml')/*"/>
</xsl:template>
</xsl:stylesheet>

  
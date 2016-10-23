<xsl:stylesheet version="1.0"
	xmlns:e="http://schemas.gratex.com/ISUP/Enums/Enums.xsd" 
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	exclude-result-prefixes="e xsl xsi"
	>
	<xsl:output method="html" omit-xml-declaration="yes"/>


	<xsl:template name="iPersonFullName">
		<xsl:choose>
			<xsl:when test="*[local-name()='nl_prefix_id']/@xsi:nil='true'"/>
			<xsl:otherwise>
				<xsl:variable name="nl_prefix_id" select="*[local-name()='nl_prefix_id']/text()" />
				<xsl:value-of select="//e:enumPrefixTitl[./e:ID_PREFIX_TITL/text()=$nl_prefix_id]/e:S_DESCRIPT/text()" />
			</xsl:otherwise>
		</xsl:choose>
		<xsl:text> </xsl:text>
		<xsl:value-of select="*[local-name()='s_fname']/text()" />
		<xsl:text> </xsl:text>
		<xsl:value-of select="*[local-name()='s_middname']/text()" />
		<xsl:text> </xsl:text>
		<xsl:value-of select="*[local-name()='s_lname']/text()" />
		<xsl:text> </xsl:text>
		<xsl:choose>
			<xsl:when test="*[local-name()='nl_suffix_id']/@xsi:nil='true'"/>
			<xsl:otherwise>
				<xsl:variable name="nl_suffix_id" select="*[local-name()='nl_suffix_id']/text()" />
				<xsl:value-of select="//e:enumSuffixTitl[./e:ID_SUFFIX_TITL/text()=$nl_suffix_id]/e:S_DESCRIPT/text()" />
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>
	<xsl:template match="*[local-name()='Person']">
		<xsl:call-template name="iPersonFullName"/>
	</xsl:template>
</xsl:stylesheet>
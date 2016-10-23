<!--
	Author:marcus@gratex.com
	Open Issues:
		!!!! NOT FINSHED !!!!!
-->
<xsl:stylesheet version="1.0"
	xmlns:e="http://schemas.gratex.com/ISUP/Enums/Enums.xsd"
	xmlns:t="http://schemas.gratex.com/ISUP/ClaimsMgmt/getPersonOut_transXML.xsd"  
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xmlns:jslib="http://www.gratex.com/ISUP/Weblibs/lib_gtiXSLutils.xsl/js"	
	xmlns:vblib="http://www.gratex.com/ISUP/Weblibs/lib_gtiXSLutils.xsl/vb"	
	exclude-result-prefixes="e xsl jslib vblib xsi t"
	>
	
	<xsl:import href="lib_gtiXSLutils.xsl"/>
	<xsl:import href="iPersonFullName.xsl" />
	<xsl:import href="iAddress.xsl" />	
		
	<xsl:output method="html"/>
	
	<xsl:template match="/">
		<xsl:for-each select="t:TransEnv/t:Person">
			<table class="g_formTable">
				<xsl:call-template name="iPersonLite"/>
			</table>
		</xsl:for-each>
	</xsl:template>

	<!-- Person -->
	<!-- Person Lite-->
	<xsl:template name="iPersonLite">
			<col class="lab"/>
			<col class="inp" style="white-space:nowrap"/>
			<col class="lab"/>
			<col class="inpT" style="white-space:nowrap"/>
			<tr>
				<td>$GL(ContractMgmtV01,s_fullname)$</td>
				<td>
					<xsl:call-template name="iPersonFullName"/>
				</td>
				<td>
					<xsl:variable name="nl_typextid_id" select="*[local-name()='nl_typextid_id']/text()" />
					<xsl:value-of select='//e:enumTypExtId[e:ID_TYPEXTID/text()=$nl_typextid_id]/e:S_DESCRIPT/text()'/>:
				</td>
				<td>
					<xsl:value-of select="*[local-name()='s_extidentif']/text()" />
				</td>
			</tr>
			<tr>
				<td>$GL(ContractMgmtV01,d_birth)$</td>
				<td>
					<xsl:choose>
						<xsl:when test="*[local-name()='d_birth']/@xsi:nil='true'">
								$GL(ContractMgmtV01,xsi_primitive_nil)$
						</xsl:when>
						<xsl:otherwise>
								<span data-dojo-type="xslt/date"><xsl:value-of select='*[local-name()="d_birth"]/text()' /></span>
						</xsl:otherwise>
					</xsl:choose>
				</td>
				<td>$GL(ContractMgmtV01,d_death)$</td>
				<td>
					<xsl:choose>
						<xsl:when test="*[local-name()='d_death']/@xsi:nil='true'">
								$GL(ContractMgmtV01,xsi_primitive_nil)$
						</xsl:when>
						<xsl:otherwise>
								<span data-dojo-type="xslt/date"><xsl:value-of select='*[local-name()="d_death"]/text()' /></span>
						</xsl:otherwise>
					</xsl:choose>
				</td>
			</tr>
			<tr>
				<td>$GL(ContractMgmtV01,dt_rtmage)$</td>
				<td>
					<xsl:choose>
						<xsl:when test="*[local-name()='dt_rtmage']/@xsi:nil='true'">
								$GL(ContractMgmtV01,xsi_primitive_nil)$
						</xsl:when>
						<xsl:otherwise>
								<span data-dojo-type="xslt/date"><xsl:value-of select='*[local-name()="dt_rtmage"]/text()' /></span>
						</xsl:otherwise>
					</xsl:choose>
				</td>
				<td>$GL(ContractMgmtV01,dt_rtm2)$</td>
				<td>
					<xsl:choose>
						<xsl:when test="*[local-name()='dt_rtm2']/@xsi:nil='true'">
								$GL(ContractMgmtV01,xsi_primitive_nil)$
						</xsl:when>
						<xsl:otherwise>
								<span data-dojo-type="xslt/date"><xsl:value-of select='*[local-name()="dt_rtm2"]/text()' /></span>
						</xsl:otherwise>
					</xsl:choose>
				</td>
			</tr>
    <tr>
      <td>$GL(ContractMgmtV01,nl_citizenship_id)$</td>
      <td colspan="3">
					<xsl:variable name="nl_citizenship_id" select="*[local-name()='nl_citizenship_id']" />
					<xsl:value-of select='//e:enumCitizenshipList/e:enumCitizenship[e:ID_CITIZENSHIP=$nl_citizenship_id]/e:SV_CNTRNAME2'/>
      </td>
    </tr>
			<xsl:if test='count(*[local-name()="PersonEx"])!=0'>
				<tr>
					<td>$GL(ContractMgmtV01,nl_rtmtyp_id)$</td>
					<td>
						<xsl:variable name="nl_rtmtyp_id" select="*[local-name()='PersonEx']/*[local-name()='nl_rtmtyp_id']"/>
						<xsl:value-of select="//e:enumRtmTyp[e:ID_RTMTYP=$nl_rtmtyp_id]/e:S_DESCRIPTION" />
					</td>
					<td>$GL(ContractMgmtV01,dt_rtmgiv)$</td>
					<td><span data-dojo-type="xslt/date"><xsl:value-of select='*[local-name()="PersonEx"]/*[local-name()="dt_rtmgiv"]/text()' /></span></td>
				</tr>
			</xsl:if>
			<xsl:for-each select="*[local-name()='AddressList']/*[local-name()='Address']">
				<tr>
					<td>
						<xsl:variable name="nl_addrtype_id" select="*[local-name()='nl_addrtype_id']/text()" />
						<xsl:value-of select="//e:enumAddrType[./e:ID_ADDRTYPE/text()=$nl_addrtype_id]/e:S_DESCRIPTION/text()" />
					</td>
					<td colspan="3">
						<xsl:value-of select="*[local-name()='s_street']/text()" />&#160;<xsl:value-of select="*[local-name()='s_strnumber']/text()" />,
						<xsl:value-of select="*[local-name()='s_town']/text()" />,
						<xsl:value-of select="*[local-name()='s_postcode']/text()" />
						<xsl:text> </xsl:text>
						<xsl:value-of select="*[local-name()='s_postoff']/text()" />,
						<xsl:variable name="nl_country_id" select="*[local-name()='nl_country_id']/text()" />
						<xsl:value-of select="//e:enumCountry[./e:ID_COUNTRY/text()=$nl_country_id]/e:S_CNTRNAME/text()" />
						, <span data-dojo-type="xslt/date">2016-08-20</span>
					</td>
				</tr>
			</xsl:for-each>
			<tr>
				<td>$GL(ContractMgmtV01,bank)$</td>
				<xsl:choose>
					<xsl:when test="count(*[local-name()='BankDtList']/*[local-name()='BankDt'])=0">
						<td colspan="3">$GL(global,xsi_composite_nil)$</td>
					</xsl:when>
					<xsl:otherwise>
						<td colspan="3">
							<xsl:for-each select="*[local-name()='BankDtList']/*[local-name()='BankDt']">
								<xsl:call-template name="RBankInlineText"/>
							</xsl:for-each>
						</td>
					</xsl:otherwise>
				</xsl:choose>
			</tr>
			<tr>
				<td>$GL(ContractMgmtV01,contdt)$</td>
				<xsl:choose>
					<xsl:when test="count(*[local-name()='ContDtList']/*[local-name()='ContDt'])=0">
						<td colspan="3">$GL(global,xsi_composite_nil)$</td>
					</xsl:when>
					<xsl:otherwise>
						<td colspan="3">
							<xsl:for-each select="*[local-name()='ContDtList']/*[local-name()='ContDt']">
								<xsl:value-of select="*[local-name()='s_contact']/text()" />,&#160;
								<xsl:value-of select="*[local-name()='s_descript']/text()" />
							</xsl:for-each>
						</td>
					</xsl:otherwise>
				</xsl:choose>
			</tr>
	</xsl:template>
</xsl:stylesheet>
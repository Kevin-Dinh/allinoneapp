<!--
Author : mku@gratex.com
Description:
	Only for includes
	
	Short and long forms of Adress, BankDt and ContDt

-->
<xsl:stylesheet version="1.0"
	xmlns:e="http://schemas.gratex.com/ISUP/Enums/Enums.xsd" 
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	exclude-result-prefixes="e xsl xsi"
	>

	<!-- TAddress Renderer -->
	<xsl:template name="RAddress">
		<tr><td colspan="2" class="bck"><table class="g_formTable">
			<col class="lab"/>
			<col class="inp"/>
			<col class="lab"/>
			<col class="inp"/>
			<tr>
				<td>$GL(ContractMgmtV01,s_street)$</td>
				<td>
					<xsl:value-of select="*[local-name()='s_street']/text()" />&#160;<xsl:value-of select="*[local-name()='s_strnumber']/text()" />
				</td>
				<td>$GL(ContractMgmtV01,s_postcode)$</td>
				<td>
					<xsl:value-of select="*[local-name()='s_postcode']/text()" />
				</td>
			</tr>
			<tr>
				<td>$GL(ContractMgmtV01,s_town)$</td>
				<td>
					<xsl:value-of select="*[local-name()='s_town']/text()" />
				</td>
				<td>$GL(ContractMgmtV01,s_postoff)$</td>
				<td>
					<xsl:value-of select="*[local-name()='s_postoff']/text()" />
				</td>
			</tr>
			<tr>
				<td>$GL(ContractMgmtV01,s_county)$</td>
				<td>
					<xsl:value-of select="*[local-name()='s_county']/text()" />
				</td>
				<td>$GL(ContractMgmtV01,nl_country_id)$</td>
				<td>
					<xsl:variable name="nl_country_id" select="*[local-name()='nl_country_id']/text()" />
					<xsl:value-of select="//e:enumCountry[./e:ID_COUNTRY/text()=$nl_country_id]/e:S_CNTRNAME/text()" />
				</td>
			</tr>
		</table></td></tr>
	</xsl:template>
	
	<!-- TAddress Inline Renderer -->
	<xsl:template name="RAddressInline">
		<tr>
			<td>
				<xsl:variable name="nl_addrtype_id" select="*[local-name()='nl_addrtype_id']/text()" />
				<xsl:value-of select="//e:enumAddrType[./e:ID_ADDRTYPE/text()=$nl_addrtype_id]/e:S_DESCRIPTION/text()" />
			</td>
			<td colspan="3">
				<xsl:call-template name="RAddressInlineText"/>
			</td>
		</tr>
	</xsl:template>
	
	<xsl:template name="RAddressInlineText">
		<xsl:value-of select="*[local-name()='s_street']/text()" />&#160;<xsl:value-of select="*[local-name()='s_strnumber']/text()" />,
		<xsl:value-of select="*[local-name()='s_town']/text()" />,
		<xsl:value-of select="*[local-name()='s_postcode']/text()"/>
		<xsl:if test="*[local-name()='s_postoff']/text()!=''">
		<xsl:text> </xsl:text>
		<xsl:value-of select="*[local-name()='s_postoff']/text()" />,</xsl:if>
		<xsl:variable name="nl_country_id" select="*[local-name()='nl_country_id']/text()" />
		<xsl:value-of select="//e:enumCountry[./e:ID_COUNTRY/text()=$nl_country_id]/e:S_CNTRNAME/text()" />
	</xsl:template>
	
	<!-- TBank Renderer -->
	<xsl:template name="RBank">
		<tr>
			<td class="g_form_heading" colspan="2"><b>$GL(ContractMgmtV01,bankdt)$</b></td>
		</tr>
		<xsl:choose>
			<xsl:when test="count(*[local-name()='s_account'])=0">
				<tr>	
					<td colspan="2">$GL(global,xsi_composite_nil)$</td>
				</tr>
			</xsl:when>
			<xsl:otherwise>
				<tr>
					<td>$GL(ContractMgmtV01,s_account)$</td>
					<td>
						<xsl:value-of select="*[local-name()='s_account']/text()" />
					</td>
				</tr>
				<tr>
					<td>$GL(ContractMgmtV01,nl_bank_id)$</td>
					<td>
						<xsl:variable name="nl_bank_id" select="*[local-name()='nl_bank_id']/text()" />
						<xsl:value-of select="//e:enumBank[./e:ID_BANK/text()=$nl_bank_id]/e:S_BANKABB/text()" />
					</td>
				</tr>
        <xsl:if test ="count(*[local-name()='s_iban'])!=0">
				<tr>
          <td class="lab">$GL(ContractMgmtV01,s_iban)$</td>
          <td><xsl:value-of select="*[local-name()='s_iban']/text()" /></td>
				</tr>
        </xsl:if>
				<tr>
					<td>$GL(ContractMgmtV01,s_descript)$</td>
					<td>
						<xsl:value-of select="*[local-name()='s_descript']/text()" />
					</td>
				</tr>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>	
	
	<xsl:template name="RBankdt">
		<xsl:call-template name="RBank"/>
	</xsl:template>	
	

	<!-- TBank Inline Renderer -->
	<xsl:template name="RBankInline">
		<tr>
			<td>$GL(ContractMgmtV01,bank)$</td>
			<td colspan="3">
				<xsl:call-template name="RBankInlineText"/>
			</td>
		</tr>
	</xsl:template>	
	<xsl:template name="RBankInlineText">
		<xsl:value-of select="*[local-name()='s_account']/text()" />/<xsl:variable name="nl_bank_id" select="*[local-name()='nl_bank_id']/text()" /><xsl:value-of select="//e:enumBank[./e:ID_BANK/text()=$nl_bank_id]/e:S_CODE/text()" />
    <xsl:if test ="count(*[local-name()='s_iban'])!=0">&#160;<xsl:value-of select="*[local-name()='s_iban']/text()" /></xsl:if>
    <xsl:text> </xsl:text><xsl:value-of select="*[local-name()='s_descript']/text()" />
	</xsl:template>	
	
	<xsl:template name="RBankdtInline">
		<xsl:call-template name="RBankInline"/>
	</xsl:template>	

	<!-- T_FXFERDT Inline Renderer -->
	<xsl:template name="RFXFERDTInlineText">
		<xsl:variable name="enumCountry" select="//e:enumCountryList/e:enumCountry"/>
		<xsl:value-of select="*[local-name()='sv_ben_name']"/>
		<BR/>$GL(FXFERDT,lab_address)$
		<xsl:value-of select="*[local-name()='sv_ben_addr']"/>&#160;
		,<xsl:value-of select="*[local-name()='sv_ben_city']"/>&#160;
		,<xsl:variable name="nl_ben_country_id" select="*[local-name()='nl_ben_country_id']/text()"/>
		<xsl:value-of select="$enumCountry[./e:ID_COUNTRY/text()=$nl_ben_country_id]/e:S_CNTRNAME"/>
		<BR/>$GL(FXFERDT,sv_pmt_titul)$:&#160;<xsl:value-of select="*[local-name()='sv_pmt_titul']"/>
		<BR/>$GL(FXFERDT,sv_subject)$:&#160;<xsl:value-of select="*[local-name()='sv_subject']"/>
		<BR/>$GL(FXFERDT,sv_note)$:&#160;<xsl:value-of select="*[local-name()='sv_note']"/>
		<BR/>$GL(FXFERDT,nl_chrgft_id)$:&#160;<xsl:variable name="nl_chrgft_id" select="*[local-name()='nl_chrgft_id']"/><xsl:value-of select="//e:enumCHRGFTList/e:enumCHRGFT[./e:ID_CHRGFT=$nl_chrgft_id]/e:S_DESCRIPTION" />
		<xsl:if test="*[local-name()='nl_currency_id']/text()!='175'">
			<BR/>$GL(FXFERDT,cy_famount)$:&#160;<xsl:value-of select="*[local-name()='cy_famount']"/>&#160;
			<xsl:variable name="nl_currency_id" select="*[local-name()='nl_currency_id']"/><xsl:value-of select="//e:enumCurrencyList/e:enumCurrency[./e:ID_CURRENCY=$nl_currency_id]/e:S_CODE" />			
		</xsl:if>
		<xsl:if test="*[local-name()='sv_iban']/text()!=''">
			<BR/>$GL(FXFERDT,lab_iban)$:<xsl:value-of select="*[local-name()='sv_iban']"/>&#160;
			,<xsl:value-of select="*[local-name()='sv_swift']"/>
			<BR/>$GL(FXFERDT,lab_bankAddress)$
			<xsl:value-of select="*[local-name()='sv_bank_name']"/>&#160;
			,<xsl:value-of select="*[local-name()='sv_bank_strt']"/>&#160;
			,<xsl:value-of select="*[local-name()='sv_bank_city']"/>&#160;
			,<xsl:variable name="nl_bank_country_id" select="*[local-name()='nl_bank_country_id']/text()"/>
			<xsl:value-of select="$enumCountry[./e:ID_COUNTRY/text()=$nl_bank_country_id]/e:S_CNTRNAME"/>
		</xsl:if>
	</xsl:template>

	
	<!-- TContdt Renderer -->
	<xsl:template name="RContdt">
			<tr>
				<td class="g_form_heading" colspan="2"><b>$GL(ContractMgmtV01,contdt)$</b></td>
			</tr>
		<xsl:choose>
			<xsl:when test="count(*[local-name()='s_contact'])=0">
			<tr>	
				<td colspan="2">$GL(global,xsi_composite_nil)$</td>
			</tr>
			</xsl:when>
			<xsl:otherwise>
			<tr>
				<td>$GL(ContractMgmtV01,s_contact)$</td>
				<td>
					<xsl:value-of select="*[local-name()='s_contact']/text()" />
				</td>
			</tr>
			<tr>
				<td>$GL(ContractMgmtV01,s_descript)$</td>
				<td>
					<xsl:value-of select="*[local-name()='s_descript']/text()" />
				</td>
			</tr>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>		

	<!-- TContdt Inline Renderer -->
	<xsl:template name="RContdtInline">
		<tr>
			<td>$GL(ContractMgmtV01,contdt)$</td>
			<td colspan="3">
				<xsl:value-of select="*[local-name()='s_contact']/text()" />,&#160;
				<xsl:value-of select="*[local-name()='s_descript']/text()" />
			</td>
		</tr>
	</xsl:template>

</xsl:stylesheet>
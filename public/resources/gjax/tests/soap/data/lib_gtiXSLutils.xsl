<?xml version="1.0" encoding="UTF-8" ?>
<xsl:stylesheet version="1.0"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:jslib="http://www.gratex.com/ISUP/Weblibs/lib_gtiXSLutils.xsl/js"
	xmlns:vblib="http://www.gratex.com/ISUP/Weblibs/lib_gtiXSLutils.xsl/vb"	
	xmlns:msxsl="urn:schemas-microsoft-com:xslt"	
	exclude-result-prefixes="xsl jslib msxsl vblib"
	>

	<msxsl:script language="VBScript" implements-prefix="vblib">
	<![CDATA[	'<%
				'
				Dim SKK_EUR
				Dim EUR_Date
				Dim EURDate_MM
				Dim Months
				SKK_EUR = CCur(30.1260) 'konverzny kurz
				EURDate_MM = CDate("2008-08-07") 'datum pre Mailmerge kedy bol urceny konverzny kurz
				EUR_Date = CDate("2009-01-01") 'datum kedy vojde do platnosti Euro
				EUR_Date_str = "2009-01-01" 'datum kedy vojde do platnosti Euro, pre stringove porovnavania v rozhodnutiach
				Months = Array("január","február","marec","apríl","máj","jún","júl","august","september","október","november","december")
				MonthsInfl = Array("januára","februára","marca","apríla","mája","júna","júla","augusta","septembra","októbra","novembra","decembra")
				
				'Zaokruhluje sa na cele desiatky eurocentov nahor
				'suma nesmie obsahovat haliere(123.45), len desiatky(123.4)
				function skk2eur(suma)
					if suma="" then
						skk2eur=""
					else
						Dim c
						Dim suma10
						suma10=CCur(m_anyStrToCDBL(suma))*CCur(10)
						c=suma10/SKK_EUR
						skk2eur=Int(c)
						if skk2eur<>c then
							if CCur(skk2eur)*CCur(SKK_EUR)<suma10 then 'Kontrola kvoli inaccurancy kedze delenim vznikne double(napr. 2/2 by vyslo 1.0000001)
								skk2eur=skk2eur+1
							end if
						end if
						skk2eur=CCur(skk2eur)/CCur(10)
					end if
				end function

				'Zaokruhluje sa na eurocent nahor
				function skk2eur2(suma)
					if suma="" then
						skk2eur2=""
					else
						Dim c
						Dim suma100
						suma100=CCur(m_anyStrToCDBL(suma))*CCur(100)
						c=suma100/SKK_EUR
						skk2eur2=Int(c)
						if skk2eur2<>c then
							if CCur(skk2eur2)*CCur(SKK_EUR)<suma100 then 'Kontrola kvoli inaccurancy kedze delenim vznikne double(napr. 2/2 by vyslo 1.0000001)
								skk2eur2=skk2eur2+1
							end if
						end if
						skk2eur2=CCur(skk2eur2)/CCur(100)
					end if
				end function


				'nezaokruhluje sa
				function skk2eur_exact(suma)
					if suma="" then
						skk2eur_exact=0	
					else
						skk2eur_exact=CCur(m_anyStrToCDBL(suma))/CCur(SKK_EUR)
					end if
				end function				
				
				'Prepocita sumu konverznym kurzom na skk.
				'Zaokruhluje sa na cele koruny nahor
				function eur2skk(suma)
					if suma="" then
						eur2skk=""
					else
						Dim total
						total=CCur(m_anyStrToCDBL(suma))*SKK_EUR
						eur2skk=Int(total)
						if eur2skk<>total then
							eur2skk=eur2skk+1
						end if
					end if
				end function
				
				function fmtSkk2Eur(suma)
					fmtSkk2Eur=fmtDBLWNDAD(skk2eur(suma),2)
				end function

				function fmtEur2Skk(suma)
					fmtEur2Skk=fmtDBLWNDAD(eur2skk(suma),0)
				end function
				
				'formatuje sumu pre vypis v mailmerge
				'		parameter format nadobuda hodnoty:
				'			RZ			rozsah zodpovednosti
				'			DVZ			denny vymeriavaci zaklad
				'			2EUR1		zobrazuje sa EUR hodnota s presnostou na desiatky eurocentov
				'			2EUR2		zobrazuje sa EUR hodnota s presnostou na eurocenty
				'			2EUR4		zobrazuje sa EUR hodnota s presnostou na 4 miesta
				'			2EUR8		zobrazuje sa EUR hodnota s presnostou na 8 miest
				'			2SKK		zobrasuje sa SKK hodnota
				'			CONV1		zobrazuje sa konvertovana suma na opacnu menu, pri SKK zaokrulene na cele koruny pri EUR na eurocenty
				'			CONV2		zobrazuje sa konvertovana suma na opacnu menu nezaokruhlena, presnost pri SKK na cele koruny pri EUR na eurocenty
				'			REP			zobrazneie pre repory bez meny pri EUR 2 miesta pri SKK 0 miest
				'			4/8			zobrazenie sumy v aktualnej mene s presnostou pri SKK na 4 miesta pri EUR na 8 miest
				'							zobrazenie sumy v aktualnej mene s presnostou pri SKK na 0 miest pri EUR na 2 miesta
				function fmtMMAmount(suma, mena, format)
					if suma = "" or suma = "NaN" then
						fmtMMAmount="$GL(global,xsi_primitive_nil)$"
					else
					select case format
						case "RZ"
							if mena="SKK" then
								fmtMMAmount=fmtDBLWNDAD(suma, 0) & Chr(160) & "SKK"
							else
								fmtMMAmount=fmtDBLWNDAD(suma, 1) & "0" & Chr(160) & "EUR"
							end if
						case "DVZ"
							fmtMMAmount=fmtDBLWNDAD(suma, 4) & Chr(160) & mena
						case "2EUR1"
							if mena="SKK" then
								fmtMMAmount=fmtDBLWNDAD(skk2eur(suma), 1) & "0" & Chr(160) & "EUR"
							else
								fmtMMAmount=fmtDBLWNDAD(suma, 1) & "0" & Chr(160) & "EUR"
							end if
						case "2EUR1_ceil"
							if mena="SKK" then
								fmtMMAmount=fmtDBLWNDAD(ceil(skk2eur(suma), 1), 1) & "0" & Chr(160) & "EUR"
							else
								fmtMMAmount=fmtDBLWNDAD(ceil(suma, 1), 1) & "0" & Chr(160) & "EUR"
							end if
						case "2EUR2"
							if mena="SKK" then
								fmtMMAmount=fmtDBLWNDAD(skk2eur2(suma), 2) & Chr(160) & "EUR"
							else
								fmtMMAmount=fmtDBLWNDAD(suma, 2) & Chr(160) & "EUR"
							end if
						case "2EUR4"
							if mena="SKK" then
								result = Int(skk2eur_exact(suma) * 10000) / 10000
								fmtMMAmount=fmtDBLWNDAD(result, 4) & Chr(160) & "EUR"
							else
								fmtMMAmount=fmtDBLWNDAD(suma, 2) & Chr(160) & "EUR"
							end if
						case "2EUR8"
							if mena="SKK" then
								result = Int(skk2eur_exact(suma) * 100000000) / 100000000
								fmtMMAmount=fmtDBLWNDAD(result, 8) & Chr(160) & "EUR"
							else
								fmtMMAmount=fmtDBLWNDAD(suma, 8) & Chr(160) & "EUR"
							end if
						case "2EUR4DVZ"
							if mena="SKK" then
								result = ceil(skk2eur_exact(suma), 4)
								fmtMMAmount=fmtDBLWNDAD(result, 4) & Chr(160) & "EUR"
							else
								fmtMMAmount=fmtDBLWNDAD(ceil(suma,4), 4) & Chr(160) & "EUR"
							end if
						case "2SKK"
							if mena="SKK" then
								fmtMMAmount=fmtDBLWNDAD(suma, 0) & Chr(160) & "SKK"
							else
								fmtMMAmount=fmtDBLWNDAD(eur2skk(suma), 0) & Chr(160) & "SKK"
							end if
						case "CONV1"
							if mena="SKK" then
								fmtMMAmount=fmtDBLWNDAD(skk2eur(suma), 2) & Chr(160) & "EUR"
							else
								fmtMMAmount=fmtDBLWNDAD(eur2skk(suma), 0) & Chr(160) & "SKK"
							end if
						case "CONV2"
							if mena="SKK" then
								result = Int(skk2eur_exact(suma) * 100) / 100
								fmtMMAmount=fmtDBLWNDAD(skk2eur2(suma), 2) & Chr(160) & "EUR"
							else
								fmtMMAmount=fmtDBLWNDAD(eur2skk(suma), 0) & Chr(160) & "SKK"
							end if
						case "CONV4"
							if mena="SKK" then
								result = Int(skk2eur_exact(suma) * 100) / 100
								fmtMMAmount=fmtDBLWNDAD(skk2eur_exact(suma), 4) & Chr(160) & "EUR"
							else
								fmtMMAmount=fmtDBLWNDAD(eur2skk(suma), 4) & Chr(160) & "SKK"
							end if
						case "REP"
							if mena="SKK" then
								fmtMMAmount=fmtDBLWNDAD(suma, 0)
							else
								fmtMMAmount=fmtDBLWNDAD(suma, 2)
							end if	
						case "4/8"
							if mena="SKK" then
								fmtMMAmount=fmtDBLWNDAD(floor(suma, 4), 4) & Chr(160) & "SKK"
							else
								fmtMMAmount=fmtDBLWNDAD(floor(suma, 8), 8) & Chr(160) & "EUR"
							end if	
						case "8/8"
							if mena="SKK" then
								fmtMMAmount=fmtDBLWNDAD(floor(suma, 8), 8) & Chr(160) & "SKK"
							else
								fmtMMAmount=fmtDBLWNDAD(floor(suma, 8), 8) & Chr(160) & "EUR"
							end if	
						case "2/2"
							if mena="SKK" then
								fmtMMAmount=fmtDBLWNDAD(suma, 2) & Chr(160) & "SKK"
							else
								fmtMMAmount=fmtDBLWNDAD(suma, 2) & Chr(160) & "EUR"
							end if	
						case "0/0"
							if mena="SKK" then
								fmtMMAmount=fmtDBLWNDAD(suma, 0) & Chr(160) & "SKK"
							else
								fmtMMAmount=fmtDBLWNDAD(suma, 0) & Chr(160) & "EUR"
							end if								
						case else
							if mena="SKK" then
								fmtMMAmount=fmtDBLWNDAD(suma, 0) & Chr(160) & "SKK"
							else
								fmtMMAmount=fmtDBLWNDAD(suma, 2) & Chr(160) & "EUR"
							end if						
					end select
					end if
				end function
				
				function getSkkAmount(amount, curr)
					if curr="SKK" then
						getSkkAmount = amount
					else
						if amount="" then
							getSkkAmount = 0	
						else
							getSkkAmount = CDbl(m_anyStrToCDBL(amount))*SKK_EUR
						end if					
						
					end if
				end function
				
				function getEurAmount(amount, curr)
					if curr="EUR" then
						getEurAmount = amount
					else
						if amount="" then
							getEurAmount = 0	
						else
							getEurAmount = CDbl(skk2eur_exact(amount))
						end if	
					end if
				end function
				
				function getRepAmount(amount, curr, resultCurr, precision)
					if curr=resultCurr then
						getRepAmount = amount
					else
						if curr="SKK" then
							select case precision
								case 2
									getRepAmount = CDbl(skk2eur2(amount))
								case 1
									getRepAmount = CDbl(skk2eur(amount))
								case 0
									getRepAmount = CDbl(skk2eur_exact(amount))
							end select
						else
							getRepAmount = CDbl(eur2skk(amount))
						end if
					end if
				end function				
				
				'formatuje sumu pre vypis v reporte
				'		ak je suma SKK zaokruhli na cele koruny
				'		ak je suma EUR zaoukruhli na eurocenty
				'ak mena je rozna od pozadovanej meny tak tuto prepocita
				function fmtRepAmount(suma, mena, poz_mena)
					if (suma="") then
						suma=0
					end if
					if mena=poz_mena then
						if mena="SKK" then
							fmtRepAmount=fmtDBLWNDAD(ceil(suma, 0), 0)
						else
							fmtRepAmount=fmtDBLWNDAD(ceil(suma, 2), 2)
						end if
					else
						if mena="SKK" then
							fmtRepAmount=fmtDBLWNDAD(skk2eur2(suma), 2)
						else
							fmtRepAmount=fmtDBLWNDAD(eur2skk(suma), 0)
						end if						
					end if
				end function
				
				function fmtDualAmount(suma, mena)
					if mena="EUR" then
						fmtDualAmount=fmtEur2Skk(suma) & " SKK"
					else
						fmtDualAmount=fmtSkk2Eur(suma) & " EUR"
					end if
				end function
				
				function getSkkEurRate()
					getSkkEurRate = CDbl(SKK_EUR)
				end function
				
				function getFmtSkkEurRate()
					getFmtSkkEurRate=fmtDBLWNDAD(SKK_EUR,4)
				end function
				
				function getSkkEurDate()
					getSkkEurDate=vbFormatDateTime(EURDate_MM,1)
				end function

				function getReportCurrencyFromYear(sYear)
					on error resume next	
					if CDate(sYear & "-01-01") < EUR_Date then
						getReportCurrencyFromYear = "SKK"
					else
						getReportCurrencyFromYear = "EUR"
					end if
					if err.number <> 0 then		
						getReportCurrencyFromYear=""	
					end if					
				end function

				function getCurrency()
					if Now < EUR_Date then
						getCurrency = "SKK"
					else
						getCurrency = "EUR"
					end if
				end function
				
				function getReportCurrency(sDate)
					on error resume next	
					if CDate(sDate) < EUR_Date then
						getReportCurrency = "SKK"
					else
						getReportCurrency = "EUR"
					end if
					if err.number <> 0 then		
						getReportCurrency=""	
					end if					
				end function
				
				function getBinary(iNum, iLength)
					Dim sRet
					sRet = ""
					do while iNum > 0
						sRet = CStr(iNum Mod 2) & sRet
						iNum = iNum \ 2
					loop
					sRet = String(iLength, "0") & sRet
					getBinary=Right(sRet, iLength)
				end function
				
				'gets current date
				'params:
				'output: string formatted to locale date
				function getDate()
					getDate=vbFormatDateTime(Now,1)
				end function

				'gets current date
				'params: 
				'	format	number equals to NamedFormat from vbscript FormatDateTime
				'output:	string formatted to locale date
				function getDate2(format)
					if format = "" then
						getDate2=Now
					else
						getDate2=vbFormatDateTime(Now,format)
					end if
				end function


				'gets current date time
				'params:
				'output: string formatted to locale date +time
				function getDateTime()
					getDateTime=vbFormatDateTime(Now,2) & " " & vbFormatDateTime(Now,4)
				end function

				'returns day in month
				'params:	sDate - string in format 'yyyy-mm-dd' to be formatted 
				'output: day in month
				'sample call: vblib:getDay(string(a:d_found))
				function getDay(sDate)
					if Trim(sDate) = "" then 
						getDay = "$GL(global,xsi_primitive_nil)$"
					else				
						getDay=Day(sDate)
					end if
				end function
				
				'returns long form of month
				'params:	sDate - string in format 'yyyy-mm-dd' to be formatted 
				'output: month
				'sample call: vblib:getMonth(string(a:d_found))
				function getMonth(sDate)
					getMonth = getMonthInfl(sDate, 0)
				end function


				'returns long form of month
				'params:	sDate - string in format 'yyyy-mm-dd' to be formatted 
				'			iInfl - which form of month to use: 1 - inflected
				'output: month
				'sample call: vblib:getMonthInfl(string(a:d_found), 1)
				function getMonthInfl(sDate, iInfl)
					if Trim(sDate) = "" then 
						getMonthInfl = ""
					else
						on error resume next	
						if iInfl = 1 then
							getMonthInfl=MonthsInfl(Month(CDate(sDate))-1)
						else
							getMonthInfl=Months(Month(CDate(sDate))-1)
						end if
						if err.number <> 0 then		
							getMonthInfl=Err.Description
						end if				
					end if
				end function

				'returns year from date
				'params:	sDate - string in format 'yyyy-mm-dd' to be formatted 
				'output: year
				'sample call: vblib:getYear(string(a:d_found))
				function getYear(sDate)
					if Trim(sDate) = "" then 
						getYear = Year(Now)
					else	
						on error resume next
						getYear=Year(CDate(sDate))
						if err.number <> 0 then		
							getYear=""
						end if
					end if
				end function
				
				'return firstday of the month
				'params: sDate - string in format 'yyyy-mm-dd' to be formatted 
				'output: first day in month
				'sample call: vblib:getfirstDayOfMonth(string(a:d_found))
				function getFirstDayOfMonth(sDate)
					if Trim(sDate) = "" then 
						getFirstDayOfMonth = ""
					else	
						on error resume next
						getFirstDayOfMonth=DatePart("yyyy", sDate) & "-" & Right("0" & DatePart("m", sDate), 2) & "-01"
						if err.number <> 0 then		
							getFirstDayOfMonth=""
						end if
					end if
				end function				
				
				'return lastday of the month
				'params: sDate - string in format 'yyyy-mm-dd' to be formatted 
				'output: last day in month
				'sample call: vblib:getLastDayOfMonth(string(a:d_found))
				function getLastDayOfMonth(sDate)
					if Trim(sDate) = "" then 
						getLastDayOfMonth = ""
					else	
						on error resume next
						oDate = CDate(DatePart("yyyy", sDate) & "-" & DatePart("m", sDate) & "-1")
						oDate =  DateAdd("d", -1, DateAdd("m", 1, oDate))
						getLastDayOfMonth=DatePart("yyyy", oDate) & "-" & Right("0" & DatePart("m", oDate), 2) & "-" & DatePart("d", oDate)
						if err.number <> 0 then		
							getLastDayOfMonth=""
						end if
					end if
				end function
				
				'return number of days in month
				'params: sDate - string in format 'yyyy-mm-dd' to be formatted 
				'output: number of days in month
				'sample call: vblib:getDaysInMonth(string(a:d_found))				
				function getDaysInMonth(sDate)
					if Trim(sDate) = "" then 
						getDaysInMonth = ""
					else	
						on error resume next
						oDate = CDate(DatePart("yyyy", sDate) & "-" & DatePart("m", sDate) & "-1")
						oDate =  DateAdd("d", -1, DateAdd("m", 1, oDate))
						getDaysInMonth=DatePart("d",oDate)
						if err.number <> 0 then		
							getDaysInMonth=""
						end if
					end if				
				end function
				
				'convert date to month priod string mm/yyyy
				'input - string in form of date datatype in XML Schema
				'output - string in form mm/yyyy
				function monthPeriod(sDate)
					on error resume next
					err.Clear 
					oDate = CDate(sDate)
					if err.number <> 0 then				
						monthPeriod = err.Description & " $GL(lib_gtiVal,err_invalid_dateformat)$ " & sDate
					else
						monthPeriod = Right("0"&DatePart("m",oDate),2) & "/" & DatePart("yyyy", oDate)
					end if
				end function
				
				'formats date to locale string
				'params:	sDate - string in format 'yyyy-mm-dd' to be formatted 
				'output: string formatted to locale date
				'sample call: vblib:fmtD(string(a:d_found))
				function fmtD(sDate)
					if Trim(sDate) = "" then 
						fmtD = "$GL(global,xsi_primitive_nil)$"
					else
						on error resume next
						fmtD=vbFormatDateTime(CDate(sDate),2)
						if err.number <> 0 then
							err.Clear 
							fmtD= CStr(CDate(sDate))
							if err.number <> 0 then				
								fmtD = err.Description & " $GL(lib_gtiVal,err_invalid_dateformat)$ " & sDate
							end if
						end if
					end if
				end function
				
				'formats date to locale string. accept empty string
				'params:	sDate - string in format 'yyyy-mm-dd' to be formatted 
				'output: string formatted to locale date
				'sample call: vblib:fmtD_N(string(a:d_found))
				function fmtD_N(sDate)
					if Trim(sDate) = "" then 
						fmtD_N = ""
					else
						on error resume next
						fmtD_N=vbFormatDateTime(CDate(sDate),2)
						if err.number <> 0 then
							err.Clear 
							fmtD_N= CStr(CDate(sDate))
							if err.number <> 0 then				
								fmtD_N = err.Description & " $GL(lib_gtiVal,err_invalid_dateformat)$ " & sDate
							end if
						end if
					end if
				end function				
				
				'formats date to locale string with long month
				'params:	sDate - string in format 'yyyy-mm-dd' to be formatted 
				'output: string formatted to locale date with long month
				'sample call: vblib:fmtDLong(string(a:d_found))
				function fmtDLong(sDate)
					if Trim(sDate) = "" then 
						fmtDLong = ""
					else
						on error resume next
						fmtDLong=vbFormatDateTime(CDate(sDate),1)
						if err.number <> 0 then
							err.Clear 
							fmtDLong= CStr(CDate(sDate))
							if err.number <> 0 then				
								fmtDLong = err.Description & " $GL(lib_gtiVal,err_invalid_dateformat)$ " & sDate
							end if
						end if
					end if
				end function

				function fmtDLongEsc(sDate)
					fmtDLongEsc=fmtDLong(sDate)
					fmtDLongEsc=Replace(fmtDLongEsc, " ", "&#160;")
				end function
                
				function fmtDLongMY(sDate)
					fmtDLongMY = fmtDLong(sDate)
					fmtDLongMY = Mid(fmtDLongMY, InStr(fmtDLongMY, ".") + 1)
				end function


				'formats dateTime to locale string
				'params:	sDate - string in format 'yyyy-mm-dd hh:mm:ss' to be formatted 
				'					use jslib:dtr to get it from xsd:dateTime format
				'			bDT - if "true", show time part too
				'output: string formatted to locale date(+time if bDT="true")
				'sample call: vblib:fmtDT(jslib:dtr(string(a:d_found)),"true")
				function fmtDT(sDateTime, bDT)
					if Trim(sDateTime) = "" then 
						fmtDT = "$GL(global,xsi_primitive_nil)$"
					else
						on error resume next
						vDateTime = CDate(sDateTime)
						fmtDT = vbFormatDateTime(vDateTime,2)
						if LCase(bDT)="true" then fmtDT = fmtDT & " " & vbFormatDateTime(vDateTime,4)
						if err.number <> 0 then
							fmtDT = "$GL(lib_gtiVal,err_invalid_datetimeformat)$ " & sDateTime
						end if
					end if
				end function
				
				'formats dateTime to time string
				'params:	sDate - string in format 'yyyy-mm-dd hh:mm:ss' to be formatted 
				'					use jslib:dtr to get it from xsd:dateTime format
				'output: string formatted to hh:mm
				'sample call: vblib:fmtT(jslib:dtr(string(a:d_found)))
				function fmtT(sDateTime)
					if Trim(sDateTime) = "" then 
						fmtT = "$GL(global,xsi_primitive_nil)$"
					else
						on error resume next
						vDateTime = CDate(sDateTime)
						fmtT = vbFormatDateTime(vDateTime,4)
						if err.number <> 0 then
							fmtT = "$GL(lib_gtiVal,err_invalid_datetimeformat)$ " & sDateTime
						end if
					end if
				end function				

				'formats date to locale string with long month and year without day part
				'params:	sDate - string in format 'yyyy-mm-dd' to be formatted 
				'output: string formatted to locale date with long month and year without day part
				'sample call: vblib:fmtFromToMonthYear(string(a:d_found))
				function fmtFromToMonthYear(sDate)
					if Trim(sDate) = "" then 
						fmtFromToMonthYear = ""
					else
						on error resume next
						fmtFromToMonthYear=vbFormatDateTime(CDate(sDate),1)
						fmtFromToMonthYear=Mid(fmtFromToMonthYear, InStr(1, fmtFromToMonthYear, " ")+1)
						if err.number <> 0 then
							err.Clear 
							fmtDLong= CStr(CDate(sDate))
							if err.number <> 0 then				
								fmtFromToMonthYear = err.Description & " $GL(lib_gtiVal,err_invalid_dateformat)$ " & sDate
							end if
						end if
					end if
				end function				

				function vbDateConvert(str,dt) 
					dim re,retVal,Matches,Match,val,dtVal
					val = str
					dtVal = dt
					if LCase(dtVal)="true" then		
						re = "([-]?)(\d{4,})-(\d{2})-(\d{2})T(\d{2}:\d{2}:\d{2})(?:(Z)|(?:([+-])(\d{2}):(\d{2})))"
					else
						re = "(\d{4})-(\d{2})-(\d{2})"
					end if

					Set regEx = New RegExp		  
					regEx.Pattern = re				  
					retVal = regEx.Test(val)  
					If retVal Then
						dim res,tmpArr
						Set Matches = regEx.Execute(val)   
						res = Matches.item(0).value
						tmpArr=split(res,"-",-1,1)				
						if LCase(dtVal)="true" then	
							dim tValue,dValue,dVal
							tValue = mid(tmpArr(2),4,8)
							dayVal = mid(tmpArr(2),1,2)
							dValue = vbMakeDate(dayVal,tmpArr(1),tmpArr(0),2)
							vbDateConvert =  CStr(dValue)+" "+CStr(tValue)
						else
							vbDateConvert = vbMakeDate(tmpArr(2),tmpArr(1),tmpArr(0),2)
						end if
						Matches=null
						tmpArr=null
					Else
					    vbDateConvert = ""
					End If
				end function


				
				function vbMakeDate(sDate, sMonth, sYear, nFmt)
					vbMakeDate = vbFormatDateTime(DateSerial(sYear,sMonth,sDate),nFmt)
				end function


				'formats number to locale string
				'params:	anyStr - string in number format to be formatted 
				'output: string formatted to locale number
				'sample call: vblib:fmtDBL(string(t:c_adjuprin))

				Function fmtDBL(anyStr)
					if anyStr = "" then
						fmtDBL="$GL(global,xsi_primitive_nil)$"
					else
						fmtDBL=fmtDBLWNDAD(anyStr,-1)
					end if
				End Function

				Function fmtDBLWNDAD(anyStr,ndad)
					if anyStr = "" then
						fmtDBLWNDAD="$GL(global,xsi_primitive_nil)$"
					else
						on error resume next
						fmtDBLWNDAD=m_CDBLToLocStringWNDAD(m_anyStrToCDBL(anyStr),ndad)
						if err<>0 then
							fmtDBLWNDAD = "$GL(lib_gtiVal,err_invalid_doubleformat)$ " & anyStr
						end if
					end if
				End Function

				Function m_anyStrToCDBL(strVal)
					sepTest = isNumeric("1.1")
					if sepTest = false then
						newStr = Replace(strVal,".",",")
					else
						newStr = Replace(strVal,",",".")
					end if
					m_anyStrToCDBL = CDbl(newStr)
				End Function

				' wrapper for FormatNumber FB function 
				Function m_CDBLToLocString(CDBLNumb)
					m_CDBLToLocString=m_CDBLToLocStringWNDAD(CDBLNumb,-1)
				End Function

				Function m_CDBLToLocStringWNDAD(CDBLNumb,ndad)
					m_CDBLToLocStringWNDAD=FormatNumber(CDBLNumb,ndad)
				End Function
				
				Function returnID(sID)
					returnID=right(sID,len(sID)-instrrev(sID,"_"))
				End Function
				
				Function vbFormatDateTime(objDate,nFmt)
					SetLocale(1051)				
					if nFmt = 2 then
						vbFormatDateTime = Right("0"&DatePart("d",objDate),2) & "." & Right("0"&DatePart("m",objDate),2) & "." & DatePart("yyyy",objDate)
					else
						vbFormatDateTime = FormatDateTime(objDate,nFmt)
					end if
				End Function
				
				function formatDateDiff(sDateDiff)
					dim sReturn, sValidDiff, iTmp, bFirstElem
					sReturn = ""
					bFirstElem = true
					sValidDiff = Right("000000" & sDateDiff, 6)

					iTmp = CInt(Mid(sValidDiff, 1, 2))
					if (iTmp <> 0) then
						sReturn = iTmp & "r"
						bFirstElem = false
					end if
					
					iTmp = CInt(Mid(sValidDiff, 3, 2))
					if (iTmp <> 0 or not bFirstElem) then
						sReturn = sReturn & iTmp & "m"
						bFirstElem = false
					end if
					
					iTmp = CInt(Mid(sValidDiff, 5, 2))
					if (iTmp <> 0 or not bFirstElem) then
						sReturn = sReturn & iTmp & "d"
					end if
					formatDateDiff = sReturn
				end function
				
				function getDateDiff(dStart, dEnd, sInterval)
					on error resume next
					getDateDiff = DateDiff(sInterval, CDate(dStart), CDate(dEnd))
					if err.number <> 0 then
						getDateDiff = "$GL(lib_gtiVal,err_invalid_datetimeformat)$ " & dStart
					end if
				end function
				
				function getEurDateStr()
					getEurDateStr = EUR_Date_str
				end function
				
				function getEurDate()
					getEurDate = CStr(EUR_Date)
				end function
				
				function getDateAdd(sInterval, iNumber, dStart)
					on error resume next
					if dStart = "" then
						dStart = Now
					end if
					oDate = DateAdd(sInterval, iNumber, CDate(dStart))
					getDateAdd=DatePart("yyyy", oDate) & "-" & Right("0" & DatePart("m", oDate), 2) & "-" & Right("0" & DatePart("d", oDate), 2)
					if err.number <> 0 then
						getDateAdd = "$GL(lib_gtiVal,err_invalid_datetimeformat)$ " & dStart
					end if
				end function
				
				function DaysInMonth(iMonth, iYear)
					if (Not IsNumeric(iMonth) Or Not IsNumeric(iYear)) then
						DaysInMonth = -1 'wrong input, have to return number
					end if
					oDate = CDate(iYear & "-" & iMonth & "-1")
					oDate = DateAdd("m", 1, oDate)
					oDate = DateAdd("d", -1, oDate)
					DaysInMonth = DatePart("d", oDate) + 1
				end function
				'	vytvorenie VS pre uc_3101
				function uc3101_VS(iCount)
					uc3101_VS = Right("0"&DatePart("d",Now),2) & Right("0"&DatePart("m",Now),2) & Right("000"&iCount, 4)
				end function
				function padRight(sStr, sChar, iLength)
					padRight = Right(String(iLength, sChar)&sStr, iLength)
				end function
				
				'zaokruhli sumu na pozadovany pocet miest vzdy nahor
				function ceil(amount, precision)
					ceil = CDbl(m_anyStrToCDBL(amount))
					'ceil = Round(ceil * 10 ^ (precision + 1)) / 10
					'ceil = Round(ceil + 49 / 100) / 10 ^ precision
                    'povodna verzia (riadky hore) 281.9000054 zaokruhlila na 281.9 (jedno desatinne), pricom ma byt 282.0
	                p = 10 ^ precision
	                ceil = VBCeil(ceil * p) / p                    
				end function

                'predchadzajuca ma aj desatinne miesta.. toto je cisto Int zalezitost
                function VBCeil(Number)
                    'VBCeil = Int(Number)
                    'if VBCeil <> Number then VBCeil = VBCeil + 1
                    'pritieklo tu 7990 a on to povazoval za rozne od svojho intu a priratal 1, co je blbost
                    If Number - Round(Number) < 0.0000001  Then
                        VBCeil = Round(Number)
                    Else
                        VBCeil = Round(Number + 0.5)
                    End If	
                end function

				'zaokruhli sumu na pozadovany pocet miest vzdy nadol
				function floor(amount, precision)
					floor = CDbl(m_anyStrToCDBL(amount))
					floor = Int(floor * 10 ^ (precision)) / 10 ^ precision
				end function				

	]]>
	</msxsl:script>

	<msxsl:script language="JScript" implements-prefix="jslib">
	<![CDATA[	
		var SKK_EUR;
		SKK_EUR = 30.1260 //konverzny kurz
	
	
		//legacy formatting functions
		function UTCtoDateTime(strDateTime)
		{
			if (strDateTime=="")
			{
				return("");
			}
			//        $1=year $2=month $3=day $4=hour:min:sec       $5=utc $6=ofs $7=hrs $8=mins
			var re = /(\d{4})-(\d{2})-(\d{2})T(\d{2}:\d{2}:\d{2})(?:(Z)|(?:([+-])(\d{2}):(\d{2})))/;
			
			var sParsable;
			
			if(re.test(strDateTime))
			{
				sParsable = ""
					+ RegExp.$2 + "/"
					+ RegExp.$3 + "/"
					+ RegExp.$1 + " "
					+ RegExp.$4 + " UTC";

				sParsable += (RegExp.$5=="Z") ? "" : RegExp.$6 + RegExp.$7 + RegExp.$8;
				dat = new Date(sParsable);
				return(dat.toLocaleString());
			}
			else
			{
				return("");
			}
		}
		function UTCtoDate(strDate)
		{
			if (strDate=="")
			{
				return("");
			}
			
			//        $1=year $2=month $3=day
			var re = /(\d{4})-(\d{2})-(\d{2})/;
			
			var sParsable;
			
			if(re.test(strDate))
			{
				sParsable = ""
					+ RegExp.$2 + "/"
					+ RegExp.$3 + "/"
					+ RegExp.$1;

				dat = new Date(sParsable);
				result = dat.toLocaleString();
				return(result.substring(0, result.lastIndexOf(" ")));
			}
			else
			{
				return("");
			}
		}
		
		/*	
			dateTime reader
			input - string in form of dateTime datatype in XML Schema
			output - string in form "YYYY:M:D H:M:S"
		*/
		function dtr(sXmlDateTime)
		{
			//        $1=BC $2=year $3=month $4=day $5=hour:min:sec       $6=utc $7=ofs $8=hrs $9=mins
			try{
				var re = /([-]?)(\d{4,})-(\d{2})-(\d{2})T(\d{2}:\d{2}:\d{2})(?:\.\d+)?(?:(Z)|(?:([+-])(\d{2}):(\d{2})))/;
				var dat = null;
				var sParsable;
	
				if(re.test(sXmlDateTime))
				{
					sParsable = ""
						+ RegExp.$3 + "/"
						+ RegExp.$4 + "/"
						+ RegExp.$2 + " "
						+ RegExp.$5 + " UTC";

					sParsable += (RegExp.$6=="Z") ? "" : RegExp.$7 + RegExp.$8 + RegExp.$9;
					
					if(RegExp.$1 == "-")
						sParsable += " B.C."
					
					
					dat = new Date(sParsable);
					return	"" + dat.getFullYear()
						+ "-" + (dat.getMonth()+1)
						+ "-" + dat.getDate()
						+ " " + dat.getHours()
						+ ":" + dat.getMinutes()
						+ ":" + dat.getSeconds();
				}
				else
				{
					//err
					return sXmlDateTime;
				}	
			}catch(ex)
			{return " Err: " + ex.description + " Param:  " + sXmlDateTime;}	
		}
	
	/**
		converts xmlDate or xmlDateTime to float number used for sorting in
		XML Table
		by: Tomas	1/8/2001
	**/
	function xmlDtToFloat(sd)
	{		
		oRes = parseXMLDateTime(sd);
		
		if ((dType = oRes.dType) == 0) return("");
		dO = (dType==1)?fromXMLd(sd):fromXMLdt(sd);		
		return(dO.getTime()/1000);		
	}
	
	var XSD_DATE=1;
	var XSD_DATETIME=2;
	var XSD_DATE_PARSE_ERROR=0;
		
	function parseXMLDateTime(sd)
	{
		var reDT = /([-]?)(\d{4,})-(\d{2})-(\d{2})T(\d{2}:\d{2}:\d{2})(?:\.\d+)?(?:(Z)|(?:([+-])(\d{2}):(\d{2})))/;
		var reD = /(\d{4})-(\d{2})-(\d{2})/;
		var o=new Object()
		if(reDT.test(sd))
		{
			o.dType=XSD_DATETIME;
			o.dRegExp=RegExp;
			return o;
		}
		if(reD.test(sd))
		{
			o.dType=XSD_DATE;
			o.dRegExp=RegExp;
			return o;
		}
		else
		{
			o.dType=XSD_DATE_PARSE_ERROR;
			o.dRegExp=null;
			return o;
		}
	}		
	
	/**
	returns JScript Date object from XSD dateTime
	**/
	function fromXMLdt(strDateTime)
	{
		//        $1=BC $2=year $3=month $4=day $5=hour:min:sec                 $6=utc $7=ofs $8=hrs $9=mins
		var re = /([-]?)(\d{4,})-(\d{2})-(\d{2})T(\d{2}:\d{2}:\d{2})(?:\.\d+)?(?:(Z)|(?:([+-])(\d{2}):(\d{2})))/;
		var dat = null;
		var sParsable;
			
		if(re.test(strDateTime))
		{
			sParsable = ""
				+ RegExp.$3 + "/"
				+ RegExp.$4 + "/"
				+ RegExp.$2 + " "
				+ RegExp.$5 + " UTC";

			sParsable += (RegExp.$6=="Z") ? "" : RegExp.$7 + RegExp.$8 + RegExp.$9;
				
			if(RegExp.$1 == "-")
				sParsable += " B.C."
				
				
			dat = new Date(sParsable);
			return(dat);
		}
		else
		{
			//err
			throw gErr_wrapError(666,"lib_gtiApcf.js","fromXMLdt failed: not a valid XMLDateTime", "");
		}
	}
	/**
	Returns Localized string representation of XSD date //kubo shit
	Returns JScript Date object from XSD dateTime //marcus
	**/
	function fromXMLd(strDate)
	{
		//valid CDate year range is 100-9999
		var re = /(\d{4})-(\d{2})-(\d{2})/;
			
		if(re.test(strDate))
		{
			//return vbMakeDate(RegExp.$3, RegExp.$2, RegExp.$1, 2); //kubo shit
				//marcus
			return new Date(RegExp.$1,RegExp.$2-1,RegExp.$3);	
		}
		else
		{
			//err
			throw gErr_wrapError(666,"lib_gtiApcf.js","fromXMLd failed: not a valid XMLDate", "");
		}
	}
	
	function getDateAdd(dDate, iDays)
	{
		var oDate = new Date(dDate.replace("-", "/"));
		var sMonth = "00" + (oDate.getMonth()+1);
		sMonth = sMonth.substr(sMonth.length-2);
		var sDay = "00" + (oDate.getDate()+iDays);
		sDay = sDay.substr(sDay.length-2);
		
		return	"" + oDate.getFullYear()
			+ "-" + sMonth
			+ "-" + sDay;
	}
	/**
	Return psc in format xxx xx //sleeper
	**/
	function getPSC(strPSC)
	{
		if (strPSC.length > 5 || typeof strPSC != "string")
			return(strPSC);
		return(strPSC.substr(0, 3) + " " + strPSC.substr(3));
	}
	/**
	Return rc in format xxxxxx/yyyy //sleeper
	**/
	function getRC(strRC)
	{
		if (strRC.length < 7 || typeof strRC != "string")
			return(strRC);
		return(strRC.substr(0, 6) + "/" + strRC.substr(6));
	}
	
	/**
	Simple func. for uc_EXPCASH and uc_EXPTXTA export xsl templates
	just doubles quot. 
	**/
	
	function repQuot(str)	
	{
		var out="";
		re=/\x22/g;
		if(re.test(str))
		{
			out=str.replace(re,'""');
			return '"'+out+'";';
		}	
		else return '"'+str+'";';
		
	}
	
	function MIN_VALUE()
	{
		return Number.MIN_VALUE;
	}

	function MAX_VALUE()
	{
		return Number.MAX_VALUE;
	}
	
	/**
	function convert number to word transcription //sleeper
	input	iNum			int			number to convert
	input sCurrency	string	currency
	output					string	word transciption
	TODO: optimizing
	**/
	function Num2Word(iNum, sCurrency)
	{
		var sResult = "";
		var iUnder1000;	//cast do tisic
		var iUnder10;	//cast do 10
		var iUnder1; //desatinna cast
		
		var rady3 = new Array(3);	//rady nasobku troch (tisic, milion, ...)
		rady3[0] = new Array(2);
		rady3[1] = new Array(6);
		rady3[2] = new Array(6);
		rady3[0][1] = "";
		rady3[1][1] = "tisíc";
		rady3[2][1] = "milión";
		rady3[2][2] = "milióny";
		rady3[2][5] = "miliónov";
		
		var rady = new Array(3);		//rady do tisic
		rady[1] = new Array(6);
		rady[2] = new Array(6);
		rady[1][1] = "desať"
		rady[1][2] = "dsať"
		rady[1][5] = "desiat"
		rady[2][1] = "sto"
		
		var zaklad = new Array(10);		//zakladne cislovky
		zaklad[0] = "";
		zaklad[1] = "jeden";
		zaklad[2] = "dva";
		zaklad[3] = "tri";
		zaklad[4] = "štyri";
		zaklad[5] = "päť";
		zaklad[6] = "šesť";
		zaklad[7] = "sedem";
		zaklad[8] = "osem";
		zaklad[9] = "deväť";
		
		var vynimky = new ActiveXObject("Scripting.Dictionary");	//vynimky (nestandardne sklonvanie a pod)
		vynimky.Add(11, "jedenásť");
		vynimky.Add(12, "dvanásť");
		vynimky.Add(13, "trinásť");
		vynimky.Add(14, "štrnásť");
		vynimky.Add(15, "pätnásť");
		vynimky.Add(16, "šestnásť");
		vynimky.Add(17, "sedemnásť");
		vynimky.Add(18, "osemnásť");
		vynimky.Add(19, "devätnásť");
		vynimky.Add(200, "dvesto");
		vynimky.Add(2000, "dvetisíc");

		iUnder1 = iNum - Math.floor(iNum);
		iNum  = Math.floor(iNum);

		for (var iRad3 = 0; iRad3 < 3; iRad3++)
		{
			iUnder1000 = iNum % 1000;
			iNum = Math.floor(iNum / 1000);
			iRad = 0;
			
			//osetrenie radov nasobku 3
			if (iUnder1000 > 0)
			{
				sRad = getRadString(rady3, iRad3, iUnder1000);
				sResult = sRad + sResult;
			}
			
			//osetrenie vynimiek pre 2 rad
			if (vynimky.Exists(iUnder1000 % 100))
			{
				sResult = vynimky.Item(iUnder1000 % 100) + sResult;
				iUnder1000 = iUnder1000 - (iUnder1000 % 100);
				iRad = 2;
			}
			
			//prvy rad
			iUnder10 = iUnder1000 % 10;
			iRad = iUnder10 > 0 && iRad == 0? iRad : 1;
			if (iRad == 0)
			{
				if (iRad3 < 2 && iNum == 0 && iUnder10 == 2) 
				{
					sResult = "dve" + sResult;
				}
				else 
				{
					sResult = zaklad[iUnder10] + sResult;
				}
				iUnder1000 = iUnder1000 - (iUnder1000 % 10);
				iRad = 1;
			}
			
			//druhy rad
			iUnder10 = (iUnder1000 % 100) / 10;
			iRad = iUnder10 > 0 && iRad == 1? iRad : 2;
			if (iRad == 1)
			{
				sRad = getRadString(rady, iRad, iUnder10);
				sResult = iUnder10==1 ? sRad + sResult : zaklad[iUnder10] + sRad + sResult;
				iUnder1000 = iUnder1000 - (iUnder1000 % 100);
				iRad = 2;
			}
			
			//osetrenie vynimiek pre 3 rad
			if (vynimky.Exists(iUnder1000))
			{
				sResult = vynimky.Item(iUnder1000) + sResult;
				iRad = 0;
			}
			//treti rad
			iUnder10 = (iUnder1000 % 1000) / 100;
			iRad = iUnder10 > 0 && iRad == 2? iRad : 0;
			if (iRad == 2)
			{
				sRad = getRadString(rady, iRad, iUnder10);
				sResult = iUnder10==1 ? sRad + sResult : zaklad[iUnder10] + sRad + sResult;
			}
		}
		//osetrenie jednotky na zaciatku
		if (iNum > 1 && sResult.substring(0, zaklad[1].length) == zaklad[1])
		{
			sResult = sResult.substr(zaklad[1].length);
		}
		sResult += " " + sCurrency;
		
		if (iUnder1 > 0)
		{
			sResult += " " + Math.round(iUnder1*100) + "/100";
		}
		return sResult;
	}
	//vratenie nazvu radu
	function getRadString(rady, iRad, iUnder10)
	{
		var sRadString;
		if (rady[iRad].length < iUnder10 + 1)
			iUnder10 = rady[iRad].length - 1;
		do
		{
			sRadString = rady[iRad][iUnder10];
			iUnder10--;
		}
		while (typeof(sRadString) == "undefined" && iUnder10 > 0);
		return sRadString;
	}		
	function fmtB(strVal)
	{
		if(strVal=="true" || strVal=="1") return "$GL(global,Yes)$";
		if(strVal=="false" || strVal=="0") return "$GL(global,No)$";
		return "";
	}
	//ocistenie cisla uctu a zavadzacie nuly
	function trimStart(sChar, sText)
	{
		var re = new RegExp("("+sChar+"*)([^"+sChar+"].*)","ig");
		re.exec(sText);
		return RegExp.$2;
	}
	
	//vygeneruje random ID to prevent to cache images
	function getRandom()
	{
		var d = new Date();
		var sReturn = "";
		sReturn += d.getHours();
		sReturn += d.getMinutes();
		sReturn += d.getSeconds();
		sReturn += d.getMilliseconds();

		return sReturn;
	}
	
	function str2Float(str)
	{
		sepTest = parseFloat("1.1");
		if (isNaN(sepTest))
		{
			str = str.replace(/\./, ",");
		}
		else
		{
			str = str.replace(/,/, ".");
		}
		return (parseFloat(str));
	}
	
	function roundNumber(number, precision, roundType)
	{
		var retVal = number*Math.pow(10,precision);
		switch(roundType)
		{
			case "round":
				retVal = Math.round(retVal);
				break;
			case "ceil":
				retVal = retVal * 1000;
				retVal = Math.floor(retVal);
				retVal = retVal / 1000;
				retVal = Math.ceil(retVal);
				break;
			case "floor":
				retVal = Math.floor(retVal);
				break;
		}
		return retVal / Math.pow(10,precision)
	}
	
	function getAmount(amount, cuurencyIn, currencyConversion, precision, roundType)
	{
		var retValue;
		retValue = amount == "" ? 0	: str2Float(amount);
		
		if (currencyConversion == "true")
		{
			retValue = cuurencyIn == "SKK" ? retValue * SKK_EUR : retValue / SKK_EUR;
		}
		
		return (roundNumber(retValue, precision, roundType));
	}
	//matematicke zaokruhlenie na 12 miest, kvoli jscript accurancy
	function clearAccuracy(n)
	{
		return parseInt(n*100000000000+0.5,10)/100000000000;
	}	

	]]>
	</msxsl:script>

  <xsl:template name="getPSC">
    <xsl:param name="psc" />
    <xsl:choose>
      <xsl:when test="string-length(string($psc)) = 5">
        <xsl:value-of select="substring($psc, 1, 3)"/>&#160;<xsl:value-of select="substring($psc, 4, 2)"/>
      </xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="$psc"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

	<xsl:template name="daysWord">
		<xsl:param name="count"/>
		<xsl:choose>
			<xsl:when test="number($count) = 1">deň</xsl:when>
			<xsl:when test="number($count) &lt; 5">dni</xsl:when>
			<xsl:otherwise>dní</xsl:otherwise>
		</xsl:choose>
	</xsl:template>
    
    <!-- skratka v zastupeni = v z. -->
    <xsl:variable name="vZast" select="'v z.'" />
</xsl:stylesheet>

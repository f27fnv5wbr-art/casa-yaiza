'use client'
import { useMemo, useRef, useState, useEffect } from 'react'
import { COUNTRY_OPTIONS } from './countries'
type Lang='es'|'en'|'de'; type Role='holder'|'adult'|'minor'
type Reservation={booking_code:string;check_in:string;check_out:string;guest_count:number;language:Lang}
type Guest={role:Role;firstName:string;surname1:string;surname2:string;sex:string;birthDate:string;nationality:string;documentType:string;documentNumber:string;documentSupport:string;address:string;locality:string;postalCode:string;municipalityCode:string;country:string;phone:string;email:string;minorRelationships:Record<string,string>;signatureData:string}
const blank=(role:Role):Guest=>({role,firstName:'',surname1:'',surname2:'',sex:'',birthDate:'',nationality:'',documentType:'',documentNumber:'',documentSupport:'',address:'',locality:'',postalCode:'',municipalityCode:'',country:'',phone:'',email:'',minorRelationships:{},signatureData:''})

const SEX_OPTIONS = [
  { value: 'H', es: 'Hombre', en: 'Male', de: 'Männlich' },
  { value: 'M', es: 'Mujer', en: 'Female', de: 'Weiblich' },
  { value: 'O', es: 'Otro', en: 'Other', de: 'Andere' },
]
 const DOCUMENT_OPTIONS = [
  { value: 'NIF', es: 'NIF / DNI', en: 'NIF / Spanish ID', de: 'NIF / Spanischer Ausweis' },
  { value: 'NIE', es: 'NIE', en: 'NIE', de: 'NIE' },
  { value: 'PAS', es: 'Pasaporte', en: 'Passport', de: 'Reisepass' },
  { value: 'OTRO', es: 'Otro documento', en: 'Other document', de: 'Anderes Dokument' },
]
const RELATION_LABELS: Record<string, { es: string; en: string; de: string }> = {
  PAD: { es: 'Padre / Madre', en: 'Father / Mother', de: 'Vater / Mutter' },
  TUT: { es: 'Tutor / Tutora legal', en: 'Legal guardian', de: 'Gesetzliche Betreuungsperson' },
  AAB: { es: 'Abuelo / Abuela', en: 'Grandfather / Grandmother', de: 'Großvater / Großmutter' },
  TIO: { es: 'Tío / Tía', en: 'Uncle / Aunt', de: 'Onkel / Tante' },
  HER: { es: 'Hermano / Hermana', en: 'Brother / Sister', de: 'Bruder / Schwester' },
  OTR: { es: 'Otros / Acompañante autorizado', en: 'Other / Authorized accompanying adult', de: 'Andere / Bevollmächtigte Begleitperson' },
}
const T:any={
 es:{booking:'Tu reserva',legalTitle:'Registro de viajeros',legalIntro:'La normativa española exige a Casa Yaiza comunicar determinados datos de las personas alojadas a las autoridades competentes. Te pedimos que completes este formulario para cumplir esta obligación establecida en el Real Decreto 933/2021.',intro:'Comprueba que los datos de tu estancia en Casa Yaiza son correctos antes de continuar.',ref:'Código de reserva',cin:'Fecha de entrada',cout:'Fecha de salida',num:'Número de huéspedes',correct:'¿Son correctos estos datos?',confirm:'Confirmar y continuar →',error:'Hay un error en mi reserva',safe:'Este enlace es exclusivo para tu reserva. Tus datos se transmitirán de forma segura.',split:'¿Quién se alojará?',splitIntro:'Indica cuántos huéspedes tienen 14 años o más y cuántos son menores de 14 años.',adults:'Huéspedes de 14 años o más',minors:'Menores de 14 años',continue:'Continuar →',holder:'Titular de la reserva',adult:'Acompañante adulto',minor:'Menor',personal:'Datos personales',first:'Nombre',sur1:'Primer apellido',sur2:'Segundo apellido',sex:'Sexo',birth:'Fecha de nacimiento',nat:'Nacionalidad',docType:'Tipo de documento',docNum:'Número de documento',support:'Número de soporte (si procede)',address:'Domicilio habitual',city:'Localidad',postalCode:'Código postal',municipalityCode:'Código INE del municipio',country:'País',phone:'Teléfono',email:'Email',contactOne:'Indica teléfono o correo electrónico (uno de los dos).',useHolderContact:'Usar contacto del titular',relation:'Parentesco con el menor',signature:'Firma',clear:'Borrar firma',next:'Siguiente →',back:'← Atrás',review:'Revisar y enviar',reviewIntro:'Comprueba los datos antes de completar el registro.',submit:'Firmar y completar registro',sending:'Enviando…',done:'Registro completado',doneText:'Gracias. Los datos de los huéspedes se han registrado correctamente.',mismatch:'La suma debe coincidir con el número total de huéspedes.',required:'Revisa los campos',fiveDigits:'5 dígitos',networkError:'No se pudo enviar. Inténtalo de nuevo.',catalogMissing:'El catálogo de parentescos SES aún no está disponible. Contacta con el alojamiento.',bookingProblem:'Contacta con el alojamiento antes de continuar si algún dato de la reserva no es correcto.',privacyLink:'Privacidad y protección de datos', privacyResponsible:'Responsable:', privacyResponsibleText:'Dacio Morales Borges · NIF 78544520A', privacyPurpose:'Finalidad:', privacyPurposeText:'Gestionar el registro de huéspedes y cumplir las obligaciones legales de comunicación del alojamiento.', privacyLegal:'Base jurídica:', privacyLegalText:'Cumplimiento de una obligación legal, conforme al Real Decreto 933/2021.', privacyRecipients:'Destinatarios:', privacyRecipientsText:'Autoridades competentes en los casos legalmente previstos.', privacyRetention:'Conservación:', privacyRetentionText:'Los datos personales se conservarán en esta aplicación durante un máximo de 60 días y posteriormente serán eliminados, sin perjuicio de los datos tratados por las autoridades competentes.', privacyRights:'Derechos:', privacyRightsText:'Puedes ejercer los derechos que correspondan en materia de protección de datos escribiendo a Daciomb@gmail.com.', privacyContact:'Contacto:', privacyContactText:'Carretera Tías-Conil 7, 35572.'}, 
 en:{booking:'Your booking',legalTitle:'Guest registration',legalIntro:'Spanish law requires Casa Yaiza to provide certain information about its guests to the competent authorities. Please complete this form so that we can comply with this legal obligation established by Royal Decree 933/2021.',intro:'Please check that the details of your stay at Casa Yaiza are correct before continuing.',ref:'Booking reference',cin:'Check-in date',cout:'Check-out date',num:'Number of guests',correct:'Are these details correct?',confirm:'Confirm and continue →',error:'There is an error in my booking',safe:'This link is unique to your booking. Your information will be transmitted securely.',split:'Who will be staying?',splitIntro:'Tell us how many guests are aged 14 or over and how many are under 14.',adults:'Guests aged 14 or over',minors:'Children under 14',continue:'Continue →',holder:'Booking holder',adult:'Adult companion',minor:'Minor',personal:'Personal details',first:'First name',sur1:'First surname',sur2:'Second surname',sex:'Sex',birth:'Date of birth',nat:'Nationality',docType:'Document type',docNum:'Document number',support:'Document support number (if applicable)',address:'Usual address',city:'City / locality',postalCode:'Postal code',municipalityCode:'Municipality INE code',country:'Country',phone:'Phone',email:'Email',contactOne:'Provide a phone number or email address (either one).',useHolderContact:'Use the booking holder’s contact',relation:'Relationship to the minor',signature:'Signature',clear:'Clear signature',next:'Next →',back:'← Back',review:'Review and submit',reviewIntro:'Please check the information before completing registration.',submit:'Sign and complete registration',sending:'Submitting…',done:'Registration complete',doneText:'Thank you. The guest details have been registered successfully.',mismatch:'The total must match the number of guests in the booking.',required:'Please check these fields',fiveDigits:'5 digits',networkError:'Could not submit. Please try again.',catalogMissing:'The SES relationship options are not available yet. Please contact the accommodation.',bookingProblem:'Please contact the accommodation before continuing if any booking detail is incorrect.',privacyLink:'Privacy and data protection', privacyResponsible:'Data controller:', privacyResponsibleText:'Dacio Morales Borges · NIF 78544520A', privacyPurpose:'Purpose:', privacyPurposeText:'To manage guest registration and comply with the accommodation’s legal reporting obligations.', privacyLegal:'Legal basis:', privacyLegalText:'Compliance with a legal obligation under Royal Decree 933/2021.', privacyRecipients:'Recipients:', privacyRecipientsText:'Competent authorities where required by law.', privacyRetention:'Retention:', privacyRetentionText:'Personal data will be stored in this application for a maximum of 60 days and will then be deleted, without prejudice to data processed by the competent authorities.', privacyRights:'Your rights:', privacyRightsText:'You may exercise your applicable data protection rights by writing to Daciomb@gmail.com.', privacyContact:'Contact:', privacyContactText:'Carretera Tías-Conil 7, 35572.'},
 de:{booking:'Ihre Buchung', legalTitle:'Gästeregistrierung',legalIntro:'Nach spanischem Recht ist Casa Yaiza verpflichtet, bestimmte Daten der beherbergten Personen an die zuständigen Behörden zu übermitteln. Bitte füllen Sie dieses Formular aus, damit wir dieser gesetzlichen Verpflichtung gemäß dem Königlichen Dekret 933/2021 nachkommen können.',intro:'Bitte überprüfen Sie, ob die Angaben zu Ihrem Aufenthalt in Casa Yaiza korrekt sind, bevor Sie fortfahren.',ref:'Buchungsnummer',cin:'Anreisedatum',cout:'Abreisedatum',num:'Anzahl der Gäste',correct:'Sind diese Angaben korrekt?',confirm:'Bestätigen und weiter →',error:'Meine Buchungsdaten sind nicht korrekt',safe:'Dieser Link ist ausschließlich für Ihre Buchung bestimmt. Ihre Daten werden sicher übertragen.',split:'Wer wird übernachten?',splitIntro:'Geben Sie an, wie viele Gäste 14 Jahre oder älter und wie viele unter 14 Jahre alt sind.',adults:'Gäste ab 14 Jahren',minors:'Kinder unter 14 Jahren',continue:'Weiter →',holder:'Buchungsinhaber',adult:'Erwachsener Begleiter',minor:'Minderjähriger',personal:'Persönliche Daten',first:'Vorname',sur1:'Erster Nachname',sur2:'Zweiter Nachname',sex:'Geschlecht',birth:'Geburtsdatum',nat:'Nationalität',docType:'Dokumentart',docNum:'Dokumentnummer',support:'Dokument-Supportnummer (falls zutreffend)',address:'Gewöhnliche Anschrift',city:'Ort',postalCode:'Postleitzahl',municipalityCode:'INE-Gemeindecode',country:'Land',phone:'Telefon',email:'E-Mail',contactOne:'Telefonnummer oder E-Mail-Adresse angeben (eines von beiden).',useHolderContact:'Kontakt der buchenden Person verwenden',relation:'Verwandtschaft zum Kind',signature:'Unterschrift',clear:'Unterschrift löschen',next:'Weiter →',back:'← Zurück',review:'Prüfen und senden',reviewIntro:'Bitte prüfen Sie die Angaben, bevor Sie die Registrierung abschließen.',submit:'Unterschreiben und Registrierung abschließen',sending:'Wird gesendet…',done:'Registrierung abgeschlossen',doneText:'Vielen Dank. Die Gästedaten wurden erfolgreich registriert.',mismatch:'Die Summe muss mit der Gesamtzahl der Gäste übereinstimmen.',required:'Bitte diese Felder prüfen',fiveDigits:'5 Ziffern',networkError:'Senden fehlgeschlagen. Bitte erneut versuchen.',catalogMissing:'Die SES-Verwandtschaftsoptionen sind noch nicht verfügbar. Bitte kontaktieren Sie die Unterkunft.',bookingProblem:'Bitte kontaktieren Sie die Unterkunft, bevor Sie fortfahren, wenn Buchungsdaten nicht korrekt sind.',privacyLink:'Datenschutz und Schutz personenbezogener Daten', privacyResponsible:'Verantwortlicher:', privacyResponsibleText:'Dacio Morales Borges · NIF 78544520A', privacyPurpose:'Zweck:', privacyPurposeText:'Verwaltung der Gästeregistrierung und Erfüllung der gesetzlichen Meldepflichten der Unterkunft.', privacyLegal:'Rechtsgrundlage:', privacyLegalText:'Erfüllung einer gesetzlichen Verpflichtung gemäß dem Königlichen Dekret 933/2021.', privacyRecipients:'Empfänger:', privacyRecipientsText:'Zuständige Behörden in den gesetzlich vorgesehenen Fällen.', privacyRetention:'Speicherdauer:', privacyRetentionText:'Personenbezogene Daten werden in dieser Anwendung höchstens 60 Tage gespeichert und anschließend gelöscht, unbeschadet der von den zuständigen Behörden verarbeiteten Daten.', privacyRights:'Ihre Rechte:', privacyRightsText:'Sie können Ihre anwendbaren Datenschutzrechte ausüben, indem Sie an Daciomb@gmail.com schreiben.', privacyContact:'Kontakt:', privacyContactText:'Carretera Tías-Conil 7, 35572.'}}

function Signature({value,onChange,label,clear}:{value:string,onChange:(v:string)=>void,label:string,clear:string}){const ref=useRef<HTMLCanvasElement>(null);const drawing=useRef(false);useEffect(()=>{const c=ref.current;if(!c)return;const ctx=c.getContext('2d');if(ctx){ctx.lineWidth=2;ctx.lineCap='round';ctx.strokeStyle='#17212b'}},[]);const pos=(e:any)=>{const c=ref.current!;const r=c.getBoundingClientRect();const p=e.touches?.[0]||e;return{x:(p.clientX-r.left)*(c.width/r.width),y:(p.clientY-r.top)*(c.height/r.height)}};const start=(e:any)=>{e.preventDefault();drawing.current=true;const p=pos(e),ctx=ref.current!.getContext('2d')!;ctx.beginPath();ctx.moveTo(p.x,p.y)};const move=(e:any)=>{if(!drawing.current)return;e.preventDefault();const p=pos(e),ctx=ref.current!.getContext('2d')!;ctx.lineTo(p.x,p.y);ctx.stroke()};const end=()=>{if(!drawing.current)return;drawing.current=false;onChange(ref.current!.toDataURL('image/png'))};return <div><label>{label} *</label><canvas ref={ref} width={700} height={180} className="signature" onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end} onTouchStart={start} onTouchMove={move} onTouchEnd={end}/><button type="button" className="secondary" onClick={()=>{ref.current?.getContext('2d')?.clearRect(0,0,700,180);onChange('')}}>{clear}</button>{value&&<span className="ok"> ✓</span>}</div>}

export default function GuestWizard({token,reservation}:{token:string;reservation:Reservation}){const [lang,setLang]=useState<Lang>(reservation.language||'es');const s=T[lang];const [step,setStep]=useState(0);const [showPrivacy,setShowPrivacy]=useState(false);const [adultCount,setAdultCount]=useState(1);const [minorCount,setMinorCount]=useState(reservation.guest_count-1);const [guests,setGuests]=useState<Guest[]>([]);const [idx,setIdx]=useState(0);const [msg,setMsg]=useState('');const [sending,setSending]=useState(false);const [relationshipOptions,setRelationshipOptions]=useState<{value:string;es:string;en:string;de:string}[]>([]);useEffect(()=>{fetch('/api/ses/relationship-types').then(r=>r.ok?r.json():Promise.reject()).then(j=>setRelationshipOptions(j.relationshipTypes.map((x:{code:string;description:string})=>({value:x.code,es:RELATION_LABELS[x.code]?.es||x.description,en:RELATION_LABELS[x.code]?.en||x.description,de:RELATION_LABELS[x.code]?.de||x.description})))).catch(()=>setRelationshipOptions([]))},[]);const build=()=>{if(adultCount+minorCount!==reservation.guest_count){setMsg(s.mismatch);return}setGuests([blank('holder'),...Array.from({length:adultCount-1},()=>blank('adult')),...Array.from({length:minorCount},()=>blank('minor'))]);setIdx(0);setMsg('');setStep(2)};const update=(k:keyof Guest,v:string|Record<string,string>)=>{setMsg('');setGuests(gs=>gs.map((g,i)=>i===idx?{...g,[k]:v}:g))};const missingFields=(g:Guest):string[]=>{
  const missing:string[]=[]
  if(!g.firstName.trim())missing.push(s.first)
  if(!g.surname1.trim())missing.push(s.sur1)
  if(!g.birthDate)missing.push(s.birth)
  if(!g.sex)missing.push(s.sex)
  if(!g.address.trim())missing.push(s.address)
  if(!g.postalCode.trim())missing.push(s.postalCode)
  if(!g.country)missing.push(s.country)
  if(g.country==='ESP'&&!/^\d{5}$/.test(g.municipalityCode))missing.push(`${s.municipalityCode} (${s.fiveDigits})`)
  if(g.country&&g.country!=='ESP'&&!g.locality.trim())missing.push(s.city)
  if(!g.phone.trim()&&!g.email.trim())missing.push(s.contactOne)
  if(g.role!=='minor'){
    if(!g.nationality)missing.push(s.nat)
    if(!g.documentType)missing.push(s.docType)
    if(!g.documentNumber.trim())missing.push(s.docNum)
    if(g.documentType==='NIF'&&!g.surname2.trim())missing.push(s.sur2)
    if(['NIF','NIE'].includes(g.documentType)&&!g.documentSupport.trim())missing.push(s.support)
    if(!g.signatureData)missing.push(s.signature)
  }
  return missing
};const missingRelationship=()=>guests.findIndex((guest,i)=>guest.role==='minor'&&!guests.some(adult=>adult.role!=='minor'&&!!adult.minorRelationships[String(i)]));const nextGuest=()=>{const missing=missingFields(guests[idx]);if(missing.length){setMsg(`${s.required}: ${missing.join(', ')}`);return}setMsg('');if(idx<guests.length-1)setIdx(idx+1);else {const minorIndex=missingRelationship();if(minorIndex>=0){setMsg(`${s.required}: ${s.relation} ${minorIndex+1}`);setIdx(0);return}setStep(3)}};const submit=async()=>{const invalidIndex=guests.findIndex(g=>missingFields(g).length>0);const minorIndex=missingRelationship();if(invalidIndex>=0||minorIndex>=0){setStep(2);setIdx(invalidIndex>=0?invalidIndex:0);setMsg(invalidIndex>=0?`${s.required}: ${missingFields(guests[invalidIndex]).join(', ')}`:`${s.required}: ${s.relation} ${minorIndex+1}`);return}setSending(true);setMsg('');try{const r=await fetch('/api/checkin/submit',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token,totalGuests:reservation.guest_count,adultCount,minorCount,guests})});const j=await r.json();if(!r.ok){setMsg(j.error||'Error');return}setStep(4)}catch{setMsg(s.networkError)}finally{setSending(false)}};const g=guests[idx];return <main className="wrap"><div className="hero"/><div className="card"><div className="top"><div><b>CASA YAIZA</b><div className="muted">Arrecife · Lanzarote</div></div><div className="lang">{(['es','en','de'] as Lang[]).map(x=><button key={x} className={lang===x?'langOn':'langOff'} onClick={()=>setLang(x)}>{x.toUpperCase()}</button>)}</div></div>{step===0&&<>
<div className="legalNotice">
  <h2>ℹ️ {s.legalTitle}</h2>
  <p>{s.legalIntro}</p>
  <button
  type="button"
  className="privacyLink"
  onClick={()=>setShowPrivacy(!showPrivacy)}
>
 {s.privacyLink}
</button>

{showPrivacy && (
  <div className="privacyInfo">
    <p><b>{s.privacyResponsible}</b> {s.privacyResponsibleText}</p>
    <p><b>{s.privacyPurpose}</b> {s.privacyPurposeText}</p>
    <p><b>{s.privacyLegal}</b> {s.privacyLegalText}</p>
    <p><b>{s.privacyRecipients}</b> {s.privacyRecipientsText}</p>
    <p><b>{s.privacyRetention}</b> {s.privacyRetentionText}</p>
    <p><b>{s.privacyRights}</b> {s.privacyRightsText}</p>
    <p><b>{s.privacyContact}</b> {s.privacyContactText}</p>
  </div>
)}
</div>
  <h2>{s.booking}</h2><p>{s.intro}</p><div className="grid"><div><b>{s.ref}</b><p>{reservation.booking_code}</p></div><div><b>{s.cin}</b><p>{reservation.check_in}</p></div><div><b>{s.cout}</b><p>{reservation.check_out}</p></div><div><b>{s.num}</b><p>{reservation.guest_count}</p></div></div><h3>{s.correct}</h3><button onClick={()=>setStep(1)}>{s.confirm}</button> <button className="secondary" onClick={()=>setMsg(s.bookingProblem)}>{s.error}</button>{msg&&<p className="notice">{msg}</p>}<p className="muted">🔒 {s.safe}</p></>}{step===1&&<><h1>{s.split}</h1><p>{s.splitIntro}</p><div className="grid"><div><label>{s.adults}</label><input type="number" min={1} max={reservation.guest_count} value={adultCount} onChange={e=>setAdultCount(Number(e.target.value))}/></div><div><label>{s.minors}</label><input type="number" min={0} max={reservation.guest_count-1} value={minorCount} onChange={e=>setMinorCount(Number(e.target.value))}/></div></div><p><b>{adultCount+minorCount} / {reservation.guest_count}</b></p>{msg&&<p className="notice">{msg}</p>}<button onClick={build}>{s.continue}</button> <button className="secondary" onClick={()=>setStep(0)}>{s.back}</button></>}{step===2&&g&&<><div className="badge">{idx+1} / {guests.length}</div><h1>{g.role==='holder'?s.holder:g.role==='adult'?s.adult:s.minor}</h1><h3>{s.personal}</h3><div className="formgrid"><Field l={s.first} v={g.firstName} set={v=>update('firstName',v)} req/><Field l={s.sur1} v={g.surname1} set={v=>update('surname1',v)} req/><Field l={s.sur2} v={g.surname2} set={v=>update('surname2',v)} req={g.documentType==='NIF'}/><Field l={s.birth} type="date" v={g.birthDate} set={v=>update('birthDate',v)} req/>
  <SelectField l={s.sex}
  v={g.sex}
  set={v => update('sex', v)}
  options={SEX_OPTIONS}
  lang={lang}
  req/>
  <SelectField
  l={s.nat}
  v={g.nationality}
  set={v => update('nationality', v)}
  options={COUNTRY_OPTIONS}
  lang={lang}
  req={g.role !== 'minor'}
   />{g.role !== 'minor' && <>
<SelectField l={s.docType}   v={g.documentType}   set={v => update('documentType', v)}   options={DOCUMENT_OPTIONS}   lang={lang}   req /><Field l={s.docNum} v={g.documentNumber} set={v=>update('documentNumber',v)} req/>

{['NIF','NIE'].includes(g.documentType) && (
  <Field
    l={s.support}
    v={g.documentSupport}
    set={v => update('documentSupport', v)}
    req
  />
)}
</>}{/* PV requires an address and contact for every traveller. */}<Field l={s.address} v={g.address} set={v=>update('address',v)} req/>
<Field l={s.city} v={g.locality} set={v=>update('locality',v)} req={g.country !== 'ESP'}/>
<Field l={s.postalCode} v={g.postalCode} set={v=>update('postalCode',v)} req/>{g.country==='ESP'&&<Field l={s.municipalityCode} v={g.municipalityCode} set={v=>update('municipalityCode',v)} req/>}<SelectField
  l={s.country}
  v={g.country}
  set={v => update('country', v)}
  options={COUNTRY_OPTIONS}
  lang={lang}
  req
/>
<div className="muted">{s.contactOne}</div>{g.role==='minor'&&!!(guests[0]?.phone||guests[0]?.email)&&<div><button type="button" className="secondary" onClick={()=>{setMsg('');setGuests(gs=>gs.map((guest,i)=>i===idx?{...guest,phone:gs[0].phone||'',email:gs[0].email||''}:guest))}}>{s.useHolderContact}</button></div>}<Field l={s.phone} v={g.phone} set={v=>update('phone',v)}/> <Field l={s.email} type="email" v={g.email} set={v=>update('email',v)}/>{g.role!=='minor'&&guests.map((minor,minorIndex)=>minor.role==='minor'&&<SelectField key={minorIndex} l={`${s.relation} ${minorIndex+1}`} v={g.minorRelationships[String(minorIndex)]||''} set={v=>update('minorRelationships',{...g.minorRelationships,[minorIndex]:v})} options={relationshipOptions} lang={lang}/>)}</div>{g.role!=='minor'&&<Signature value={g.signatureData} onChange={v=>update('signatureData',v)} label={s.signature} clear={s.clear}/>} {minorCount>0&&!relationshipOptions.length&&<p className="notice">{s.catalogMissing}</p>}{msg&&<p className="notice">{msg}</p>}<div className="actions"><button onClick={nextGuest}>{s.next}</button><button className="secondary" onClick={()=>{setMsg('');if(idx>0)setIdx(idx-1);else setStep(1)}}>{s.back}</button></div></>}{step===3&&<><h1>{s.review}</h1><p>{s.reviewIntro}</p>{guests.map((x,i)=><div className="review" key={i}><b>{i+1}. {x.firstName} {x.surname1}</b><span>{x.role==='holder'?s.holder:x.role==='adult'?s.adult:s.minor}</span><span>{x.birthDate}</span></div>)}{msg&&<p className="notice">{msg}</p>}<button disabled={sending} onClick={submit}>{sending?s.sending:s.submit}</button> <button className="secondary" onClick={()=>{setIdx(guests.length-1);setStep(2)}}>{s.back}</button></>}{step===4&&<div className="complete"><div className="check">✓</div><h1>{s.done}</h1><p>{s.doneText}</p><p className="muted">{reservation.booking_code}</p></div>}</div></main>}
function Field({l,v,set,type='text',req=false}:{l:string,v:string,set:(v:string)=>void,type?:string,req?:boolean}){return <div><label>{l}{req?' *':''}</label><input type={type} value={v} onChange={e=>set(e.target.value)} required={req}/></div>}


function SelectField({
  l,
  v,
  set,
  options,
  lang,
  req = false,
}: {
  l: string
  v: string
  set: (v: string) => void
  options: Array<{
    value: string
    es: string
    en: string
    de: string
  }>
  lang: Lang
  req?: boolean
}) {
  const placeholder = {
    es: 'Seleccionar…',
    en: 'Select…',
    de: 'Auswählen…',
  }

  return (
    <div>
      <label>{l}{req ? ' *' : ''}</label>
      <select
        value={v}
        onChange={e => set(e.target.value)}
        required={req}
      >
        <option value="">{placeholder[lang]}</option>

        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option[lang]}
          </option>
        ))}
      </select>
    </div>
  )
}

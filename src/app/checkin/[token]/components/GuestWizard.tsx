'use client'
import { useMemo, useRef, useState, useEffect } from 'react'
import { COUNTRY_OPTIONS } from './countries'
type Lang='es'|'en'|'de'; type Role='holder'|'adult'|'minor'
type Reservation={booking_code:string;check_in:string;check_out:string;guest_count:number;language:Lang}
type Guest={role:Role;firstName:string;surname1:string;surname2:string;sex:string;birthDate:string;nationality:string;documentType:string;documentNumber:string;documentSupport:string;address:string;locality:string;country:string;phone:string;email:string;relationshipToAdult:string;signatureData:string}
const blank=(role:Role):Guest=>({role,firstName:'',surname1:'',surname2:'',sex:'',birthDate:'',nationality:'',documentType:'',documentNumber:'',documentSupport:'',address:'',locality:'',country:'',phone:'',email:'',relationshipToAdult:'',signatureData:''})

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
const T:any={
 es:{booking:'Tu reserva',intro:'Comprueba que los datos de tu estancia en Casa Yaiza son correctos antes de continuar.',ref:'Código de reserva',cin:'Fecha de entrada',cout:'Fecha de salida',num:'Número de huéspedes',correct:'¿Son correctos estos datos?',confirm:'Confirmar y continuar →',error:'Hay un error en mi reserva',safe:'Este enlace es exclusivo para tu reserva. Tus datos se transmitirán de forma segura.',split:'¿Quién se alojará?',splitIntro:'Indica cuántos huéspedes tienen 14 años o más y cuántos son menores de 14 años.',adults:'Huéspedes de 14 años o más',minors:'Menores de 14 años',continue:'Continuar →',holder:'Titular de la reserva',adult:'Acompañante adulto',minor:'Menor',personal:'Datos personales',first:'Nombre',sur1:'Primer apellido',sur2:'Segundo apellido',sex:'Sexo',birth:'Fecha de nacimiento',nat:'Nacionalidad',docType:'Tipo de documento',docNum:'Número de documento',support:'Número de soporte (si procede)',address:'Domicilio habitual',city:'Localidad',country:'País',phone:'Teléfono',email:'Email',relation:'Relación con el adulto responsable',signature:'Firma',clear:'Borrar firma',next:'Siguiente →',back:'← Atrás',review:'Revisar y enviar',reviewIntro:'Comprueba los datos antes de completar el registro.',submit:'Firmar y completar registro',sending:'Enviando…',done:'Registro completado',doneText:'Gracias. Los datos de los huéspedes se han registrado correctamente.',mismatch:'La suma debe coincidir con el número total de huéspedes.',required:'Completa los campos obligatorios y la firma.',bookingProblem:'Contacta con el alojamiento antes de continuar si algún dato de la reserva no es correcto.'},
 en:{booking:'Your booking',intro:'Please check that the details of your stay at Casa Yaiza are correct before continuing.',ref:'Booking reference',cin:'Check-in date',cout:'Check-out date',num:'Number of guests',correct:'Are these details correct?',confirm:'Confirm and continue →',error:'There is an error in my booking',safe:'This link is unique to your booking. Your information will be transmitted securely.',split:'Who will be staying?',splitIntro:'Tell us how many guests are aged 14 or over and how many are under 14.',adults:'Guests aged 14 or over',minors:'Children under 14',continue:'Continue →',holder:'Booking holder',adult:'Adult companion',minor:'Minor',personal:'Personal details',first:'First name',sur1:'First surname',sur2:'Second surname',sex:'Sex',birth:'Date of birth',nat:'Nationality',docType:'Document type',docNum:'Document number',support:'Document support number (if applicable)',address:'Usual address',city:'City / locality',country:'Country',phone:'Phone',email:'Email',relation:'Relationship to responsible adult',signature:'Signature',clear:'Clear signature',next:'Next →',back:'← Back',review:'Review and submit',reviewIntro:'Please check the information before completing registration.',submit:'Sign and complete registration',sending:'Submitting…',done:'Registration complete',doneText:'Thank you. The guest details have been registered successfully.',mismatch:'The total must match the number of guests in the booking.',required:'Please complete all required fields and signatures.',bookingProblem:'Please contact the accommodation before continuing if any booking detail is incorrect.'},
 de:{booking:'Ihre Buchung',intro:'Bitte überprüfen Sie, ob die Angaben zu Ihrem Aufenthalt in Casa Yaiza korrekt sind, bevor Sie fortfahren.',ref:'Buchungsnummer',cin:'Anreisedatum',cout:'Abreisedatum',num:'Anzahl der Gäste',correct:'Sind diese Angaben korrekt?',confirm:'Bestätigen und weiter →',error:'Meine Buchungsdaten sind nicht korrekt',safe:'Dieser Link ist ausschließlich für Ihre Buchung bestimmt. Ihre Daten werden sicher übertragen.',split:'Wer wird übernachten?',splitIntro:'Geben Sie an, wie viele Gäste 14 Jahre oder älter und wie viele unter 14 Jahre alt sind.',adults:'Gäste ab 14 Jahren',minors:'Kinder unter 14 Jahren',continue:'Weiter →',holder:'Buchungsinhaber',adult:'Erwachsener Begleiter',minor:'Minderjähriger',personal:'Persönliche Daten',first:'Vorname',sur1:'Erster Nachname',sur2:'Zweiter Nachname',sex:'Geschlecht',birth:'Geburtsdatum',nat:'Nationalität',docType:'Dokumentart',docNum:'Dokumentnummer',support:'Dokument-Supportnummer (falls zutreffend)',address:'Gewöhnliche Anschrift',city:'Ort',country:'Land',phone:'Telefon',email:'E-Mail',relation:'Beziehung zum verantwortlichen Erwachsenen',signature:'Unterschrift',clear:'Unterschrift löschen',next:'Weiter →',back:'← Zurück',review:'Prüfen und senden',reviewIntro:'Bitte prüfen Sie die Angaben, bevor Sie die Registrierung abschließen.',submit:'Unterschreiben und Registrierung abschließen',sending:'Wird gesendet…',done:'Registrierung abgeschlossen',doneText:'Vielen Dank. Die Gästedaten wurden erfolgreich registriert.',mismatch:'Die Summe muss mit der Gesamtzahl der Gäste übereinstimmen.',required:'Bitte füllen Sie alle Pflichtfelder aus und unterschreiben Sie.',bookingProblem:'Bitte kontaktieren Sie die Unterkunft, bevor Sie fortfahren, wenn Buchungsdaten nicht korrekt sind.'}}

function Signature({value,onChange,label,clear}:{value:string,onChange:(v:string)=>void,label:string,clear:string}){const ref=useRef<HTMLCanvasElement>(null);const drawing=useRef(false);useEffect(()=>{const c=ref.current;if(!c)return;const ctx=c.getContext('2d');if(ctx){ctx.lineWidth=2;ctx.lineCap='round';ctx.strokeStyle='#17212b'}},[]);const pos=(e:any)=>{const c=ref.current!;const r=c.getBoundingClientRect();const p=e.touches?.[0]||e;return{x:(p.clientX-r.left)*(c.width/r.width),y:(p.clientY-r.top)*(c.height/r.height)}};const start=(e:any)=>{e.preventDefault();drawing.current=true;const p=pos(e),ctx=ref.current!.getContext('2d')!;ctx.beginPath();ctx.moveTo(p.x,p.y)};const move=(e:any)=>{if(!drawing.current)return;e.preventDefault();const p=pos(e),ctx=ref.current!.getContext('2d')!;ctx.lineTo(p.x,p.y);ctx.stroke()};const end=()=>{if(!drawing.current)return;drawing.current=false;onChange(ref.current!.toDataURL('image/png'))};return <div><label>{label} *</label><canvas ref={ref} width={700} height={180} className="signature" onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end} onTouchStart={start} onTouchMove={move} onTouchEnd={end}/><button type="button" className="secondary" onClick={()=>{ref.current?.getContext('2d')?.clearRect(0,0,700,180);onChange('')}}>{clear}</button>{value&&<span className="ok"> ✓</span>}</div>}

export default function GuestWizard({token,reservation}:{token:string;reservation:Reservation}){const [lang,setLang]=useState<Lang>(reservation.language||'es');const s=T[lang];const [step,setStep]=useState(0);const [adultCount,setAdultCount]=useState(1);const [minorCount,setMinorCount]=useState(reservation.guest_count-1);const [guests,setGuests]=useState<Guest[]>([]);const [idx,setIdx]=useState(0);const [msg,setMsg]=useState('');const [sending,setSending]=useState(false);const build=()=>{if(adultCount+minorCount!==reservation.guest_count){setMsg(s.mismatch);return}setGuests([blank('holder'),...Array.from({length:adultCount-1},()=>blank('adult')),...Array.from({length:minorCount},()=>blank('minor'))]);setIdx(0);setMsg('');setStep(2)};const update=(k:keyof Guest,v:string)=>setGuests(gs=>gs.map((g,i)=>i===idx?{...g,[k]:v}:g));const valid=(g:Guest)=>{
  const basic = g.firstName && g.surname1 && g.birthDate && g.sex && g.nationality

  if (g.role === 'minor') {
    return basic && g.relationshipToAdult
  }

  const supportOk =
    !['NIF', 'NIE'].includes(g.documentType) || !!g.documentSupport

  return basic &&
    g.documentType &&
    g.documentNumber &&
    supportOk &&
    g.address &&
    g.locality &&
    g.country &&
    g.signatureData
}; const nextGuest=()=>{if(!valid(guests[idx])){setMsg(s.required);return}setMsg('');if(idx<guests.length-1)setIdx(idx+1);else setStep(3)};const submit=async()=>{if(guests.some(g=>!valid(g))){setMsg(s.required);setStep(2);setIdx(Math.max(0,guests.findIndex(g=>!valid(g))));return}setSending(true);setMsg('');const r=await fetch('/api/checkin/submit',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token,totalGuests:reservation.guest_count,adultCount,minorCount,guests})});const j=await r.json();setSending(false);if(!r.ok){setMsg(j.error||'Error');return}setStep(4)};const g=guests[idx];return <main className="wrap"><div className="hero"/><div className="card"><div className="top"><div><b>CASA YAIZA</b><div className="muted">Arrecife · Lanzarote</div></div><div className="lang">{(['es','en','de'] as Lang[]).map(x=><button key={x} className={lang===x?'langOn':'langOff'} onClick={()=>setLang(x)}>{x.toUpperCase()}</button>)}</div></div>{step===0&&<><h1>{s.booking}</h1><p>{s.intro}</p><div className="grid"><div><b>{s.ref}</b><p>{reservation.booking_code}</p></div><div><b>{s.cin}</b><p>{reservation.check_in}</p></div><div><b>{s.cout}</b><p>{reservation.check_out}</p></div><div><b>{s.num}</b><p>{reservation.guest_count}</p></div></div><h3>{s.correct}</h3><button onClick={()=>setStep(1)}>{s.confirm}</button> <button className="secondary" onClick={()=>setMsg(s.bookingProblem)}>{s.error}</button>{msg&&<p className="notice">{msg}</p>}<p className="muted">🔒 {s.safe}</p></>}{step===1&&<><h1>{s.split}</h1><p>{s.splitIntro}</p><div className="grid"><div><label>{s.adults}</label><input type="number" min={1} max={reservation.guest_count} value={adultCount} onChange={e=>setAdultCount(Number(e.target.value))}/></div><div><label>{s.minors}</label><input type="number" min={0} max={reservation.guest_count-1} value={minorCount} onChange={e=>setMinorCount(Number(e.target.value))}/></div></div><p><b>{adultCount+minorCount} / {reservation.guest_count}</b></p>{msg&&<p className="notice">{msg}</p>}<button onClick={build}>{s.continue}</button> <button className="secondary" onClick={()=>setStep(0)}>{s.back}</button></>}{step===2&&g&&<><div className="badge">{idx+1} / {guests.length}</div><h1>{g.role==='holder'?s.holder:g.role==='adult'?s.adult:s.minor}</h1><h3>{s.personal}</h3><div className="formgrid"><Field l={s.first} v={g.firstName} set={v=>update('firstName',v)} req/><Field l={s.sur1} v={g.surname1} set={v=>update('surname1',v)} req/><Field l={s.sur2} v={g.surname2} set={v=>update('surname2',v)}/><Field l={s.birth} type="date" v={g.birthDate} set={v=>update('birthDate',v)} req/>
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

{(g.documentType === 'NIF' || g.documentType === 'NIE') && (
  <Field
    l={s.support}
    v={g.documentSupport}
    set={v => update('documentSupport', v)}
    req
  />
)}
<Field l={s.address} v={g.address} set={v=>update('address',v)} req/>
<Field l={s.city} v={g.locality} set={v=>update('locality',v)} req/>
<SelectField
  l={s.country}
  v={g.country}
  set={v => update('country', v)}
  options={COUNTRY_OPTIONS}
  lang={lang}
  req
/>
<Field l={s.phone} v={g.phone} set={v=>update('phone',v)}/><Field l={s.email} type="email" v={g.email} set={v=>update('email',v)}/></>}{g.role==='minor'&&<Field l={s.relation} v={g.relationshipToAdult} set={v=>update('relationshipToAdult',v)} req/>}</div>{g.role!=='minor'&&<Signature value={g.signatureData} onChange={v=>update('signatureData',v)} label={s.signature} clear={s.clear}/>} {msg&&<p className="notice">{msg}</p>}<div className="actions"><button onClick={nextGuest}>{s.next}</button><button className="secondary" onClick={()=>{setMsg('');if(idx>0)setIdx(idx-1);else setStep(1)}}>{s.back}</button></div></>}{step===3&&<><h1>{s.review}</h1><p>{s.reviewIntro}</p>{guests.map((x,i)=><div className="review" key={i}><b>{i+1}. {x.firstName} {x.surname1}</b><span>{x.role==='holder'?s.holder:x.role==='adult'?s.adult:s.minor}</span><span>{x.birthDate}</span></div>)}{msg&&<p className="notice">{msg}</p>}<button disabled={sending} onClick={submit}>{sending?s.sending:s.submit}</button> <button className="secondary" onClick={()=>{setIdx(guests.length-1);setStep(2)}}>{s.back}</button></>}{step===4&&<div className="complete"><div className="check">✓</div><h1>{s.done}</h1><p>{s.doneText}</p><p className="muted">{reservation.booking_code}</p></div>}</div></main>}
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

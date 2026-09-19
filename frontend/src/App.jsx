import { useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

async function api(path, options = {}, token = null) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Error de comunicación');
  return data;
}

function Shell({ title, children, onLogout }) {
  return <main className="app"><header><div className="brand">CALATAYUD<br/><small>GASTRONÓMICO</small></div>{onLogout && <button className="secondary" onClick={onLogout}>Salir</button>}</header><h1>{title}</h1>{children}</main>;
}

function Customer({ session, logout }) {
  const [campaigns, setCampaigns] = useState([]), [campaign, setCampaign] = useState(null), [summary, setSummary] = useState(null), [qr, setQr] = useState(null), [message, setMessage] = useState('');
  useEffect(() => { api('/campaigns').then(setCampaigns).catch(e => setMessage(e.message)); }, []);
  async function loadCampaign(id) { try { setCampaign(id); const [data, qrData] = await Promise.all([api(`/campaigns/${id}/summary`, {}, session.token), api(`/campaigns/${id}/qr`, {method:'POST',body:'{}'}, session.token)]); setSummary(data); setQr(qrData.qr_token); } catch(e) { setMessage(e.message); } }
  if (!campaign) return <Shell title={`Hola, ${session.user.name}`} onLogout={logout}><h2>Mis campañas</h2>{campaigns.map(c => <button className="list-button" key={c.id} onClick={()=>loadCampaign(c.id)}><strong>{c.name}</strong><span>{c.start_date || 'Fecha pendiente'}</span></button>)}</Shell>;
  return <Shell title={summary?.campaign?.name || 'Mi ruta'} onLogout={()=>setCampaign(null)}>{summary && <><div className="stats"><div><strong>{summary.totals.points}</strong><span>participaciones</span></div><div><strong>{summary.totals.participations}</strong><span>visitas</span></div></div><section className="card qr-card"><h2>Mi QR</h2><QRCodeSVG value={qr} size={260}/><p><b>Muestra tu QR en el establecimiento para validar tu participación.</b></p><small>QR permanente de esta campaña.</small></section><section className="card"><h2>Mi ruta</h2>{summary.establishments.map(e=><div className="establishment" key={e.id}><div><strong>{e.name}</strong><span>{e.address || 'Calatayud'}</span></div><b>{e.visits} visita{e.visits===1?'':'s'}</b></div>)}</section></>}{message&&<p className="error">{message}</p>}</Shell>;
}

function Staff({ onLogin }) {
  const [staffId,setStaffId]=useState('1'),[password,setPassword]=useState('demo'),[error,setError]=useState('');
  async function login(e){e.preventDefault();try{const data=await api('/staff/login',{method:'POST',body:JSON.stringify({staffId,password})});onLogin(data)}catch(e){setError(e.message)}}
  return <Shell title="Zona de establecimiento"><form className="card" onSubmit={login}><h2>Acceso del establecimiento</h2><label>ID de empleado<input value={staffId} onChange={e=>setStaffId(e.target.value)}/></label><label>Contraseña<input type="password" value={password} onChange={e=>setPassword(e.target.value)}/></label><button>Entrar</button>{error&&<p className="error">{error}</p>}</form></Shell>;
}

function StaffPanel({session,logout}){
  const [scan,setScan]=useState(''),[result,setResult]=useState(null),[error,setError]=useState(''),[scanner,setScanner]=useState(false);
  useEffect(()=>{if(!scanner)return;const qr=new Html5QrcodeScanner('reader',{fps:10,qrbox:{width:230,height:230}},false);qr.render(decoded=>{setScan(decoded);setScanner(false);qr.clear().catch(()=>{})},()=>{});return()=>qr.clear().catch(()=>{})},[scanner]);
  async function validate(){try{setError('');const data=await api('/visits/validate',{method:'POST',body:JSON.stringify({qrToken:scan})},session.token);setResult(data);setScan('')}catch(e){setError(e.message)}}
  return <Shell title="Validar visita" onLogout={logout}><section className="card"><h2>Escanear QR del cliente</h2><p>El cliente muestra su QR y el establecimiento lo escanea.</p>{!scanner&&<button onClick={()=>setScanner(true)}>Abrir cámara</button>}{scanner&&<div id="reader" className="scanner"/>}<label>Token QR<input value={scan} onChange={e=>setScan(e.target.value)} placeholder="Para pruebas manuales"/></label><button disabled={!scan} onClick={validate}>Validar participación</button>{result&&<div className="success"><strong>Visita validada</strong><span>{result.customerName}</span><span>+{result.points} participaciones</span><small>Visita nº {result.visitNumber} en este establecimiento</small></div>}{error&&<p className="error">{error}</p>}</section></Shell>;
}

function AdminLogin({onLogin}){
  const [email,setEmail]=useState('admin@calatayud.local'),[password,setPassword]=useState('password'),[error,setError]=useState('');
  async function submit(e){e.preventDefault();try{const data=await api('/admin/login',{method:'POST',body:JSON.stringify({email,password})});onLogin(data)}catch(e){setError(e.message)}}
  return <Shell title="Administración"><form className="card" onSubmit={submit}><h2>Panel de administración</h2><label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Contraseña<input type="password" value={password} onChange={e=>setPassword(e.target.value)}/></label><button>Entrar</button>{error&&<p className="error">{error}</p>}<p className="hint">Demo: admin@calatayud.local / password.</p></form></Shell>;
}

function AdminPanel({session,logout}){
  const [tab,setTab]=useState('dashboard'),[dashboard,setDashboard]=useState(null),[campaigns,setCampaigns]=useState([]),[establishments,setEstablishments]=useState([]),[selected,setSelected]=useState(null),[message,setMessage]=useState('');
  async function load(){try{const [d,c,e]=await Promise.all([api('/admin/dashboard',{},session.token),api('/admin/campaigns',{},session.token),api('/admin/establishments',{},session.token)]);setDashboard(d);setCampaigns(c);setEstablishments(e)}catch(e){setMessage(e.message)}}
  useEffect(()=>{load()},[]);
  return <main className="admin-app"><header className="admin-header"><div><div className="brand">CALATAYUD GASTRONÓMICO</div><small>Panel de administración</small></div><button className="secondary" onClick={logout}>Salir</button></header><nav className="admin-nav">{[['dashboard','Resumen'],['campaigns','Campañas'],['establishments','Establecimientos']].map(([id,label])=><button key={id} className={tab===id?'active':''} onClick={()=>{setTab(id);setSelected(null)}}>{label}</button>)}</nav>{message&&<p className="error">{message}</p>}{tab==='dashboard'&&<Dashboard data={dashboard}/>} {tab==='campaigns'&&<CampaignManager campaigns={campaigns} establishments={establishments} token={session.token} selected={selected} setSelected={setSelected} reload={load}/>} {tab==='establishments'&&<EstablishmentManager establishments={establishments} token={session.token} reload={load}/>}</main>;
}

function Dashboard({data}){
  if(!data)return <div className="loading">Cargando...</div>;
  const cards=[['Campañas',data.totals.campaigns],['Activas',data.totals.activeCampaigns],['Clientes',data.totals.users],['Establecimientos',data.totals.establishments],['Visitas',data.totals.visits],['Participaciones',data.totals.points]];
  return <section><h2>Resumen general</h2><div className="admin-grid">{cards.map(([a,b])=><div className="metric" key={a}><span>{a}</span><strong>{b}</strong></div>)}</div><section className="card"><h3>Últimas validaciones</h3><div className="table-wrap"><table><thead><tr><th>Cliente</th><th>Establecimiento</th><th>Campaña</th><th>Pts.</th><th>Fecha</th></tr></thead><tbody>{data.recent.map((r,i)=><tr key={i}><td>{r.customer}</td><td>{r.establishment}</td><td>{r.campaign}</td><td>+{r.points}</td><td>{new Date(r.validated_at).toLocaleString('es-ES')}</td></tr>)}</tbody></table></div></section></section>;
}

function CampaignManager({campaigns,establishments,token,selected,setSelected,reload}){
  const [form,setForm]=useState({name:'',slug:'',campaignType:'TORTILLA',editionNumber:'',startDate:'',endDate:'',firstVisitPoints:2,repeatVisitPoints:1,description:''});
  const [detail,setDetail]=useState(null),[prizes,setPrizes]=useState([]),[participants,setParticipants]=useState([]),[draws,setDraws]=useState([]),[assigned,setAssigned]=useState([]),[error,setError]=useState('');
  async function create(e){e.preventDefault();try{await api('/admin/campaigns',{method:'POST',body:JSON.stringify(form)},token);setForm({...form,name:'',slug:'',description:''});reload()}catch(e){setError(e.message)}}
  async function open(c){setSelected(c.id);setDetail(c);try{const [a,p,u,d]=await Promise.all([api(`/admin/campaigns/${c.id}/establishments`,{},token),api(`/admin/campaigns/${c.id}/prizes`,{},token),api(`/admin/campaigns/${c.id}/participants`,{},token),api(`/admin/campaigns/${c.id}/draws`,{},token)]);setAssigned(a);setPrizes(p);setParticipants(u);setDraws(d)}catch(e){setError(e.message)}}
  async function toggleEst(id,active){try{await api(`/admin/campaigns/${detail.id}/establishments`,{method:'POST',body:JSON.stringify({establishmentId:id,active})},token);open(detail)}catch(e){setError(e.message)}}
  async function addPrize(){const name=prompt('Nombre del premio');if(!name)return;const quantity=Number(prompt('Cantidad','1')||1);await api(`/admin/campaigns/${detail.id}/prizes`,{method:'POST',body:JSON.stringify({name,quantity})},token);open(detail)}
  async function addDraw(){const name=prompt('Nombre del sorteo');if(!name)return;await api(`/admin/campaigns/${detail.id}/draws`,{method:'POST',body:JSON.stringify({name})},token);open(detail)}
  return <section><h2>Campañas</h2><div className="admin-two"><form className="card" onSubmit={create}><h3>Nueva campaña</h3><label>Nombre<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/></label><label>Slug<input value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})} placeholder="iv-ruta-tortilla-2026" required/></label><div className="form-row"><label>Tipo<input value={form.campaignType} onChange={e=>setForm({...form,campaignType:e.target.value})}/></label><label>Edición<input type="number" value={form.editionNumber} onChange={e=>setForm({...form,editionNumber:e.target.value})}/></label></div><div className="form-row"><label>Inicio<input type="date" value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})}/></label><label>Fin<input type="date" value={form.endDate} onChange={e=>setForm({...form,endDate:e.target.value})}/></label></div><div className="form-row"><label>1ª visita<input type="number" min="0" value={form.firstVisitPoints} onChange={e=>setForm({...form,firstVisitPoints:e.target.value})}/></label><label>Repetición<input type="number" min="0" value={form.repeatVisitPoints} onChange={e=>setForm({...form,repeatVisitPoints:e.target.value})}/></label></div><label>Descripción<textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label><button>Crear campaña</button>{error&&<p className="error">{error}</p>}</form><div><div className="card"><h3>Campañas existentes</h3>{campaigns.map(c=><button className="list-button" key={c.id} onClick={()=>open(c)}><strong>{c.name}</strong><span>{c.start_date||'sin fecha'} · {c.establishment_count} establecimientos · {c.points_total} participaciones</span></button>)}</div>{detail&&<CampaignDetail detail={detail} assigned={assigned} participants={participants} prizes={prizes} draws={draws} establishments={establishments} toggleEst={toggleEst} addPrize={addPrize} addDraw={addDraw}/>}</div></div></section>;
}

function CampaignDetail({detail,assigned,participants,prizes,draws,toggleEst,addPrize,addDraw}){
  const assignedCount=assigned.filter(x=>x.assigned).length;
  return <div className="card"><h3>{detail.name}</h3><p>{detail.description||'Sin descripción'}</p><div className="mini-stats"><b>{assignedCount} establecimientos</b><b>{detail.first_visit_points} pts. primera visita</b><b>{detail.repeat_visit_points} pts. repetición</b></div><h4>Establecimientos de la campaña</h4>{assigned.map(e=><label className="check-row" key={e.id}><input type="checkbox" checked={!!e.assigned} onChange={ev=>toggleEst(e.id,ev.target.checked)}/><span>{e.name}</span></label>)}<div className="section-title"><h4>Premios</h4><button onClick={addPrize}>+ Premio</button></div>{prizes.map(p=><div className="row" key={p.id}><span>{p.name}</span><b>x{p.quantity}</b></div>)}<div className="section-title"><h4>Sorteos</h4><button onClick={addDraw}>+ Sorteo</button></div>{draws.map(d=><div className="row" key={d.id}><span>{d.name}</span><small>{d.entries} participaciones cargadas · {d.winners} ganadores</small></div>)}<h4>Participantes</h4><div className="table-wrap"><table><thead><tr><th>Cliente</th><th>Móvil</th><th>Visitas</th><th>Participaciones</th></tr></thead><tbody>{participants.map(p=><tr key={p.id}><td>{p.name}</td><td>{p.phone}</td><td>{p.visits}</td><td><b>{p.points}</b></td></tr>)}</tbody></table></div></div>;
}

function EstablishmentManager({establishments,token,reload}){
  const [name,setName]=useState(''),[address,setAddress]=useState(''),[error,setError]=useState('');
  async function add(e){e.preventDefault();try{await api('/admin/establishments',{method:'POST',body:JSON.stringify({name,address})},token);setName('');setAddress('');reload()}catch(e){setError(e.message)}}
  return <section><h2>Establecimientos</h2><div className="admin-two"><form className="card" onSubmit={add}><h3>Nuevo establecimiento</h3><label>Nombre<input value={name} onChange={e=>setName(e.target.value)} required/></label><label>Dirección<input value={address} onChange={e=>setAddress(e.target.value)}/></label><button>Añadir</button>{error&&<p className="error">{error}</p>}</form><div className="card"><h3>Listado</h3>{establishments.map(e=><div className="row" key={e.id}><div><strong>{e.name}</strong><small>{e.address||'Sin dirección'}</small></div><span>{e.campaign_count} campañas · {e.visit_count} visitas</span></div>)}</div></div></section>;
}

export default function App(){
  const [mode,setMode]=useState('customer');
  const [session,setSession]=useState(()=>{try{return JSON.parse(localStorage.getItem('cg_session'))||null}catch{return null}});
  const [name,setName]=useState(''),[phone,setPhone]=useState(''),[error,setError]=useState('');
  function save(data){localStorage.setItem('cg_session',JSON.stringify(data));setSession(data)}
  function logout(){localStorage.removeItem('cg_session');setSession(null);setMode('customer')}
  async function register(e){e.preventDefault();try{setError('');const data=await api('/users/register',{method:'POST',body:JSON.stringify({name,phone})});save(data)}catch(e){setError(e.message)}}
  if(mode==='admin'){if(session?.admin)return <AdminPanel session={session} logout={logout}/>;return <><AdminLogin onLogin={data=>save({...data,admin:true})}/><div className="mode-switch"><button onClick={()=>setMode('customer')}>Volver</button></div></>}
  if(mode==='staff'){if(session?.staff)return <StaffPanel session={session} logout={logout}/>;return <><Staff onLogin={data=>save({...data,staff:true})}/><div className="mode-switch"><button onClick={()=>setMode('customer')}>Volver</button></div></>}
  if(session?.user)return <Customer session={session} logout={logout}/>;
  return <main className="app landing"><div className="brand">CALATAYUD<br/><small>GASTRONÓMICO</small></div><h1>Tu ruta empieza aquí.</h1><p>Regístrate con tu nombre y móvil y participa en las rutas gastronómicas.</p><form className="card" onSubmit={register}><label>Nombre<input value={name} onChange={e=>setName(e.target.value)} required/></label><label>Móvil<input value={phone} onChange={e=>setPhone(e.target.value)} inputMode="tel" required/></label><button>Registrarme</button>{error&&<p className="error">{error}</p>}</form><div className="mode-switch"><button onClick={()=>setMode('staff')}>Acceso establecimientos</button><button onClick={()=>setMode('admin')}>Administración</button></div></main>;
}

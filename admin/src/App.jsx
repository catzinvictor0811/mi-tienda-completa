import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Shield, Package, Truck, Settings, LogOut, 
  Trash2, Edit, Eye, EyeOff, Sun, ShoppingBag 
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80';

const prodInicial = {
  id: '',
  nombre: '',
  precio: '',
  seccion: 'tienda',
  categoria: 'Abarrotes',
  proveedorId: '',
  imagen: '',
  descripcion: '',
  activo: true
};

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('admin_token') || '');
  const [password, setPassword] = useState('');
  const [tab, setTab] = useState('productos');

  const [config, setConfig] = useState({
    nombreTienda: '',
    subtitulo: '',
    logoUrl: '',
    bannerUrl: '',
    whatsappTel: ''
  });
  const [productos, setProductos] = useState([]);
  const [proveedores, setProveedores] = useState([]);

  const [nuevoProd, setNuevoProd] = useState(prodInicial);
  const [nuevoProvNombre, setNuevoProvNombre] = useState('');
  const [guardandoProd, setGuardandoProd] = useState(false);
  const [guardandoConfig, setGuardandoConfig] = useState(false);

  const cargarDatos = async () => {
    try {
      const [resConfig, resProds, resProvs] = await Promise.all([
        axios.get(`${API_URL}/config`),
        axios.get(`${API_URL}/productos`),
        axios.get(`${API_URL}/proveedores`)
      ]);

      if (resConfig.data) {
        setConfig({
          nombreTienda: resConfig.data.nombreTienda || '',
          subtitulo: resConfig.data.subtitulo || '',
          logoUrl: resConfig.data.logoUrl || '',
          bannerUrl: resConfig.data.bannerUrl || '',
          whatsappTel: resConfig.data.whatsappTel || ''
        });
      }

      const prodsMapeados = (resProds.data || []).map(p => ({
        ...p,
        id: p.id || p._id,
        seccion: p.seccion || 'tienda',
        activo: p.activo !== undefined ? p.activo : true
      }));
      setProductos(prodsMapeados);

      const provsMapeados = (resProvs.data || []).map(pr => ({
        ...pr,
        id: pr.id || pr._id
      }));
      setProveedores(provsMapeados);
    } catch (err) {
      console.error('Error al cargar datos:', err);
    }
  };

  useEffect(() => {
    if (token) cargarDatos();
  }, [token]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/admin/login`, { password });
      setToken(res.data.token);
      localStorage.setItem('admin_token', res.data.token);
      setPassword('');
    } catch (err) {
      alert('Contraseña incorrecta');
    }
  };

  const logout = () => {
    setToken('');
    localStorage.removeItem('admin_token');
  };

  const getHeaders = () => ({ headers: { Authorization: `Bearer ${token}` } });

  const guardarProducto = async (e) => {
    e.preventDefault();
    if (guardandoProd) return;

    if (!nuevoProd.nombre.trim() || nuevoProd.precio === '') {
      return alert('Por favor completa el nombre y el precio del producto.');
    }

    setGuardandoProd(true);
    try {
      const payload = {
        nombre: nuevoProd.nombre.trim(),
        precio: parseFloat(nuevoProd.precio) || 0,
        seccion: nuevoProd.seccion || 'tienda',
        categoria: (nuevoProd.categoria || '').trim() || 'General',
        proveedorId: nuevoProd.proveedorId || '',
        imagen: nuevoProd.imagen || '',
        descripcion: nuevoProd.descripcion || '',
        activo: nuevoProd.activo !== false
      };

      if (nuevoProd.id) {
        await axios.put(`${API_URL}/admin/productos/${nuevoProd.id}`, payload, getHeaders());
      } else {
        await axios.post(`${API_URL}/admin/productos`, payload, getHeaders());
      }

      setNuevoProd(prodInicial);
      await cargarDatos();
      alert('Producto guardado con éxito.');
    } catch (err) {
      console.error('Error al guardar producto:', err);
      alert('No se pudo guardar el producto. Verifica tu conexión o vuelve a iniciar sesión.');
    } finally {
      setGuardandoProd(false);
    }
  };

  const toggleEstadoProducto = async (prod) => {
    const prodActualizado = { ...prod, activo: !prod.activo };
    try {
      await axios.put(`${API_URL}/admin/productos/${prod.id}`, prodActualizado, getHeaders());
      await cargarDatos();
    } catch (err) {
      console.error('Error al cambiar estado:', err);
      alert('No se pudo cambiar el estado del producto.');
    }
  };

  const eliminarProducto = async (id) => {
    if (confirm('¿Eliminar este producto?')) {
      try {
        await axios.delete(`${API_URL}/admin/productos/${id}`, getHeaders());
        await cargarDatos();
      } catch (err) {
        console.error('Error al eliminar producto:', err);
        alert('No se pudo eliminar el producto.');
      }
    }
  };

  const agregarProveedor = async (e) => {
    e.preventDefault();
    if (!nuevoProvNombre.trim()) return;
    try {
      await axios.post(`${API_URL}/admin/proveedores`, { nombre: nuevoProvNombre.trim() }, getHeaders());
      setNuevoProvNombre('');
      await cargarDatos();
    } catch (err) {
      console.error('Error al agregar proveedor:', err);
      alert('No se pudo agregar el proveedor.');
    }
  };

  const eliminarProveedor = async (id) => {
    if (confirm('¿Eliminar proveedor?')) {
      try {
        await axios.delete(`${API_URL}/admin/proveedores/${id}`, getHeaders());
        await cargarDatos();
      } catch (err) {
        console.error('Error al eliminar proveedor:', err);
        alert('No se pudo eliminar el proveedor.');
      }
    }
  };

  const guardarConfig = async (e) => {
    e.preventDefault();
    if (guardandoConfig) return;

    setGuardandoConfig(true);
    try {
      await axios.put(`${API_URL}/admin/config`, config, getHeaders());
      await cargarDatos();
      alert('Configuración guardada con éxito');
    } catch (err) {
      console.error('Error al guardar configuración:', err);
      alert('No se pudo guardar la configuración. Revisa tu conexión.');
    } finally {
      setGuardandoConfig(false);
    }
  };

  // Comprime/redimensiona imágenes locales para evitar payloads pesados
  const handleImagenLocal = (e, callback, maxAncho = 900) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const escala = img.width > maxAncho ? maxAncho / img.width : 1;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * escala);
        canvas.height = Math.round(img.height * escala);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        callback(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl max-w-md w-full space-y-6">
          <div className="flex justify-center text-violet-500 mb-2">
            <div className="p-4 bg-violet-500/10 rounded-2xl border border-violet-500/20">
              <Shield size={40} />
            </div>
          </div>
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-black text-white">Panel de Administración</h2>
            <p className="text-xs text-slate-400">Introduce tu contraseña de administrador para ingresar</p>
          </div>
          <input 
            type="password" placeholder="Contraseña" required 
            value={password} onChange={e => setPassword(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 px-4 py-3 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 font-bold"
          />
          <button type="submit" className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black py-3.5 rounded-2xl text-sm shadow-lg shadow-indigo-600/20 transition active:scale-95 cursor-pointer">
            Iniciar Sesión
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col text-slate-100 font-sans">
      <header className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex justify-between items-center shadow-xl sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-600/20 border border-violet-500/30 rounded-xl text-violet-400">
            <Shield size={22} />
          </div>
          <h1 className="font-black text-lg text-white">Panel de Control - Tienda</h1>
        </div>
        <button onClick={logout} className="bg-rose-600/20 border border-rose-500/30 hover:bg-rose-600 text-rose-300 hover:text-white text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold transition cursor-pointer">
          <LogOut size={16} /> Cerrar Sesión
        </button>
      </header>

      <div className="max-w-7xl mx-auto w-full p-6 flex-grow space-y-6">
        <div className="flex gap-3 border-b border-slate-800 pb-4 flex-wrap">
          <button type="button" onClick={() => setTab('productos')} className={`px-5 py-2.5 rounded-2xl text-sm font-black flex items-center gap-2 transition cursor-pointer ${tab === 'productos' ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30' : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'}`}>
            <Package size={17} /> Productos ({productos.length})
          </button>
          <button type="button" onClick={() => setTab('proveedores')} className={`px-5 py-2.5 rounded-2xl text-sm font-black flex items-center gap-2 transition cursor-pointer ${tab === 'proveedores' ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30' : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'}`}>
            <Truck size={17} /> Proveedores ({proveedores.length})
          </button>
          <button type="button" onClick={() => setTab('config')} className={`px-5 py-2.5 rounded-2xl text-sm font-black flex items-center gap-2 transition cursor-pointer ${tab === 'config' ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30' : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'}`}>
            <Settings size={17} /> Ajustes General
          </button>
        </div>

        {tab === 'productos' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <form onSubmit={guardarProducto} className="bg-slate-950 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4 h-fit">
              <h3 className="font-black text-lg text-white">{nuevoProd.id ? 'Editar Producto' : 'Crear Nuevo Producto'}</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Apartado de la Tienda</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNuevoProd({ ...nuevoProd, seccion: 'tienda', categoria: nuevoProd.categoria === 'Calzado' ? 'Abarrotes' : nuevoProd.categoria })}
                      className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                        nuevoProd.seccion === 'tienda'
                          ? 'bg-violet-600 border-violet-500 text-white shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <ShoppingBag size={14} /> Tienda Normal
                    </button>
                    <button
                      type="button"
                      onClick={() => setNuevoProd({ ...nuevoProd, seccion: 'playa', categoria: nuevoProd.categoria === 'Abarrotes' ? 'Calzado' : nuevoProd.categoria })}
                      className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                        nuevoProd.seccion === 'playa'
                          ? 'bg-cyan-600 border-cyan-500 text-white shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Sun size={14} /> Zona de Playa
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Nombre del Producto</label>
                  <input type="text" placeholder={nuevoProd.seccion === 'playa' ? 'Ej. Chanclas de Playa / Traje de Baño' : 'Ej. Refresco 2L'} required value={nuevoProd.nombre} onChange={e => setNuevoProd({...nuevoProd, nombre: e.target.value})} className="w-full bg-slate-900 border border-slate-800 px-3.5 py-2.5 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-bold" />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-400 block mb-1">Precio ($)</label>
                    <input type="number" step="0.01" placeholder="0.00" required value={nuevoProd.precio} onChange={e => setNuevoProd({...nuevoProd, precio: e.target.value})} className="w-full bg-slate-900 border border-slate-800 px-3.5 py-2.5 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-bold" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 block mb-1">Categoría</label>
                    <input type="text" placeholder={nuevoProd.seccion === 'playa' ? 'Ej. Chanclas, Ropa, Lentes' : 'Ej. Abarrotes'} value={nuevoProd.categoria} onChange={e => setNuevoProd({...nuevoProd, categoria: e.target.value})} className="w-full bg-slate-900 border border-slate-800 px-3.5 py-2.5 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-bold" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Proveedor Asociado</label>
                  <select value={nuevoProd.proveedorId} onChange={e => setNuevoProd({...nuevoProd, proveedorId: e.target.value})} className="w-full bg-slate-900 border border-slate-800 px-3.5 py-2.5 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-bold">
                    <option value="">Sin Proveedor</option>
                    {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                </div>

                <div className="flex items-center gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <input 
                    type="checkbox" 
                    id="activoCheck"
                    checked={nuevoProd.activo} 
                    onChange={e => setNuevoProd({...nuevoProd, activo: e.target.checked})} 
                    className="w-4 h-4 accent-violet-600 rounded cursor-pointer"
                  />
                  <label htmlFor="activoCheck" className="text-xs font-bold text-slate-300 cursor-pointer">
                    {nuevoProd.activo ? '✅ Producto Activo (Visible en tienda)' : '❌ Producto Agotado (Oculto en tienda)'}
                  </label>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Imagen del Producto</label>
                  <input type="file" accept="image/*" onChange={e => handleImagenLocal(e, (url) => setNuevoProd({...nuevoProd, imagen: url}), 700)} className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-violet-600 file:text-white hover:file:bg-violet-500 cursor-pointer" />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Descripción / Tallas</label>
                  <textarea placeholder="Detalles, tallas disponibles..." value={nuevoProd.descripcion} onChange={e => setNuevoProd({...nuevoProd, descripcion: e.target.value})} className="w-full bg-slate-900 border border-slate-800 px-3.5 py-2.5 rounded-xl text-xs text-white placeholder-slate-500 h-20 focus:outline-none focus:ring-2 focus:ring-violet-500 font-medium" />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={guardandoProd}
                  className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 text-white py-3 rounded-xl font-black text-xs shadow-lg shadow-violet-600/25 transition cursor-pointer"
                >
                  {guardandoProd ? 'Guardando...' : nuevoProd.id ? 'Guardar Cambios' : 'Crear Producto'}
                </button>
                {nuevoProd.id && (
                  <button
                    type="button"
                    onClick={() => setNuevoProd(prodInicial)}
                    className="bg-slate-800 text-slate-300 px-3 py-3 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>

            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-black text-lg text-white">Catálogo Actual ({productos.length})</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {productos.map(p => {
                  const prov = proveedores.find(pr => pr.id === p.proveedorId);
                  const precioNum = typeof p.precio === 'number' ? p.precio : parseFloat(p.precio) || 0;
                  const esPlaya = p.seccion === 'playa';
                  return (
                    <div key={p.id} className={`bg-slate-950 border p-4 rounded-2xl shadow-lg flex items-center justify-between gap-3 ${p.activo === false ? 'border-rose-900/50 opacity-60' : esPlaya ? 'border-cyan-900/60' : 'border-slate-800'}`}>
                      <img src={p.imagen || FALLBACK_IMG} alt="" className="w-16 h-16 object-cover rounded-xl border border-slate-800 bg-slate-900" />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${esPlaya ? 'text-cyan-300 bg-cyan-950/80 border-cyan-800/60' : 'text-violet-400 bg-violet-950/80 border-violet-900/50'}`}>
                            {esPlaya ? '🏖️ Playa' : '🛒 Tienda'}
                          </span>
                          <span className="text-[10px] font-bold uppercase text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{p.categoria}</span>
                        </div>
                        <h4 className="font-bold text-sm text-white truncate mt-1">{p.nombre}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-slate-400 font-semibold">${precioNum.toFixed(2)} {prov && `• ${prov.nombre}`}</p>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${p.activo !== false ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'}`}>
                            {p.activo !== false ? 'Disponible' : 'Agotado'}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <button type="button" onClick={() => toggleEstadoProducto(p)} className={`p-2 rounded-xl transition cursor-pointer ${p.activo !== false ? 'bg-emerald-950 text-emerald-400 hover:bg-emerald-900' : 'bg-rose-950 text-rose-400 hover:bg-rose-900'}`} title={p.activo !== false ? "Desactivar" : "Activar"}>
                          {p.activo !== false ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                        <button type="button" onClick={() => setNuevoProd({ ...p, seccion: p.seccion || 'tienda' })} className="p-2 bg-slate-900 hover:bg-violet-600 hover:text-white rounded-xl text-slate-300 transition cursor-pointer" title="Editar">
                          <Edit size={14} />
                        </button>
                        <button type="button" onClick={() => eliminarProducto(p.id)} className="p-2 bg-slate-900 hover:bg-rose-600 hover:text-white rounded-xl text-rose-400 transition cursor-pointer" title="Eliminar">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {tab === 'proveedores' && (
          <div className="bg-slate-950 border border-slate-800 p-8 rounded-3xl shadow-xl max-w-xl space-y-6">
            <div>
              <h3 className="font-black text-lg text-white">Gestión de Proveedores</h3>
              <p className="text-xs text-slate-400">Agrega tiendas externas de las cuales obtienes mercancía.</p>
            </div>
            <form onSubmit={agregarProveedor} className="flex gap-2">
              <input type="text" placeholder="Nombre del proveedor..." required value={nuevoProvNombre} onChange={e => setNuevoProvNombre(e.target.value)} className="flex-1 bg-slate-900 border border-slate-800 px-4 py-3 rounded-2xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-bold" />
              <button type="submit" className="bg-violet-600 hover:bg-violet-500 text-white px-5 rounded-2xl text-xs font-black shadow-lg shadow-violet-600/25 transition cursor-pointer">Agregar</button>
            </form>
            <div className="space-y-3">
              {proveedores.map(pr => (
                <div key={pr.id} className="flex items-center justify-between p-4 border border-slate-800 rounded-2xl bg-slate-900 shadow-inner">
                  <h4 className="font-bold text-sm text-white">{pr.nombre}</h4>
                  <button type="button" onClick={() => eliminarProveedor(pr.id)} className="text-rose-400 hover:text-rose-300 text-xs font-bold bg-rose-950/50 border border-rose-900/50 px-3 py-1.5 rounded-xl transition cursor-pointer">Eliminar</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'config' && (
          <form onSubmit={guardarConfig} className="bg-slate-950 border border-slate-800 p-8 rounded-3xl shadow-xl max-w-xl space-y-6">
            <div>
              <h3 className="font-black text-lg text-white">Ajustes de la Tienda</h3>
              <p className="text-xs text-slate-400">Personaliza la información general y las imágenes de tu tienda pública.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Nombre de la Tienda</label>
                <input type="text" value={config.nombreTienda} onChange={e => setConfig({...config, nombreTienda: e.target.value})} className="w-full bg-slate-900 border border-slate-800 px-4 py-3 rounded-2xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-bold" />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Subtítulo / Eslogan</label>
                <input type="text" value={config.subtitulo} onChange={e => setConfig({...config, subtitulo: e.target.value})} className="w-full bg-slate-900 border border-slate-800 px-4 py-3 rounded-2xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-bold" />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Teléfono de WhatsApp (Ej. 52999...)</label>
                <input type="text" value={config.whatsappTel} onChange={e => setConfig({...config, whatsappTel: e.target.value})} className="w-full bg-slate-900 border border-slate-800 px-4 py-3 rounded-2xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-bold" />
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="text-xs font-bold text-slate-400 block">Logo de la Tienda</label>
                <div className="flex items-center gap-4">
                  <img src={config.logoUrl || FALLBACK_IMG} alt="Logo" className="w-14 h-14 object-cover rounded-2xl border border-slate-800 bg-slate-900" />
                  <input type="file" accept="image/*" onChange={e => handleImagenLocal(e, (url) => setConfig({...config, logoUrl: url}), 400)} className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-violet-600 file:text-white hover:file:bg-violet-500 cursor-pointer" />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="text-xs font-bold text-slate-400 block">Imagen de Banner / Portada</label>
                <div className="flex items-center gap-4">
                  <img src={config.bannerUrl || FALLBACK_IMG} alt="Banner" className="w-20 h-14 object-cover rounded-2xl border border-slate-800 bg-slate-900" />
                  <input type="file" accept="image/*" onChange={e => handleImagenLocal(e, (url) => setConfig({...config, bannerUrl: url}), 1100)} className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-violet-600 file:text-white hover:file:bg-violet-500 cursor-pointer" />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={guardandoConfig}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 text-white py-3.5 rounded-2xl font-black text-xs shadow-lg shadow-violet-600/25 transition cursor-pointer"
            >
              {guardandoConfig ? 'Guardando...' : 'Guardar Cambios de Configuración'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
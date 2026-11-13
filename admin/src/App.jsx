import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Shield, Package, Truck, Settings, LogOut, 
  Plus, Trash2, Edit, Store, Sparkles, Image as ImageIcon, Eye, EyeOff 
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80';

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('admin_token') || '');
  const [password, setPassword] = useState('');
  const [tab, setTab] = useState('productos');

  const [config, setConfig] = useState({ nombreTienda: '', subtitulo: '', logoUrl: '', bannerUrl: '', whatsappTel: '' });
  const [productos, setProductos] = useState([]);
  const [proveedores, setProveedores] = useState([]);

  const [nuevoProd, setNuevoProd] = useState({ 
    id: '', nombre: '', precio: '', categoria: 'Abarrotes', 
    proveedorId: '', imagen: '', descripcion: '', activo: true 
  });
  const [nuevoProvNombre, setNuevoProvNombre] = useState('');

  const cargarDatos = async () => {
    try {
      const [resConfig, resProds, resProvs] = await Promise.all([
        axios.get(`${API_URL}/config`),
        axios.get(`${API_URL}/productos`),
        axios.get(`${API_URL}/proveedores`)
      ]);
      setConfig(resConfig.data);
      
      const prodsMapeados = (resProds.data || []).map(p => ({
        ...p,
        id: p.id || p._id,
        activo: p.activo !== undefined ? p.activo : true
      }));
      setProductos(prodsMapeados);

      const provsMapeados = (resProvs.data || []).map(pr => ({
        ...pr,
        id: pr.id || pr._id
      }));
      setProveedores(provsMapeados);

    } catch (err) {
      console.error(err);
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
    if (nuevoProd.id) {
      await axios.put(`${API_URL}/admin/productos/${nuevoProd.id}`, nuevoProd, getHeaders());
    } else {
      await axios.post(`${API_URL}/admin/productos`, nuevoProd, getHeaders());
    }
    setNuevoProd({ id: '', nombre: '', precio: '', categoria: 'Abarrotes', proveedorId: '', imagen: '', descripcion: '', activo: true });
    cargarDatos();
  };

  // Función rápida para alternar estado activo/inactivo desde la lista
  const toggleEstadoProducto = async (prod) => {
    const prodActualizado = { ...prod, activo: !prod.activo };
    try {
      await axios.put(`${API_URL}/admin/productos/${prod.id}`, prodActualizado, getHeaders());
      cargarDatos();
    } catch (err) {
      console.error('Error al cambiar estado', err);
    }
  };

  const eliminarProducto = async (id) => {
    if (confirm('¿Eliminar este producto?')) {
      await axios.delete(`${API_URL}/admin/productos/${id}`, getHeaders());
      cargarDatos();
    }
  };

  const agregarProveedor = async (e) => {
    e.preventDefault();
    if (!nuevoProvNombre.trim()) return;
    await axios.post(`${API_URL}/admin/proveedores`, { nombre: nuevoProvNombre }, getHeaders());
    setNuevoProvNombre('');
    cargarDatos();
  };

  const eliminarProveedor = async (id) => {
    if (confirm('¿Eliminar proveedor?')) {
      await axios.delete(`${API_URL}/admin/proveedores/${id}`, getHeaders());
      cargarDatos();
    }
  };

  const guardarConfig = async (e) => {
    e.preventDefault();
    await axios.put(`${API_URL}/admin/config`, config, getHeaders());
    alert('Configuración guardada con éxito');
  };

  const handleImagenLocal = (e, callback) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => callback(reader.result);
      reader.readAsDataURL(file);
    }
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
          <button type="submit" className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black py-3.5 rounded-2xl text-sm shadow-lg shadow-indigo-600/20 transition active:scale-95">
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
        <button onClick={logout} className="bg-rose-600/20 border border-rose-500/30 hover:bg-rose-600 text-rose-300 hover:text-white text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold transition">
          <LogOut size={16} /> Cerrar Sesión
        </button>
      </header>

      <div className="max-w-7xl mx-auto w-full p-6 flex-grow space-y-6">
        <div className="flex gap-3 border-b border-slate-800 pb-4">
          <button onClick={() => setTab('productos')} className={`px-5 py-2.5 rounded-2xl text-sm font-black flex items-center gap-2 transition ${tab === 'productos' ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30' : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'}`}>
            <Package size={17} /> Productos ({productos.length})
          </button>
          <button onClick={() => setTab('proveedores')} className={`px-5 py-2.5 rounded-2xl text-sm font-black flex items-center gap-2 transition ${tab === 'proveedores' ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30' : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'}`}>
            <Truck size={17} /> Proveedores ({proveedores.length})
          </button>
          <button onClick={() => setTab('config')} className={`px-5 py-2.5 rounded-2xl text-sm font-black flex items-center gap-2 transition ${tab === 'config' ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30' : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'}`}>
            <Settings size={17} /> Ajustes General
          </button>
        </div>

        {tab === 'productos' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <form onSubmit={guardarProducto} className="bg-slate-950 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4 h-fit">
              <h3 className="font-black text-lg text-white">{nuevoProd.id ? 'Editar Producto' : 'Crear Nuevo Producto'}</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Nombre del Producto</label>
                  <input type="text" placeholder="Ej. Refresco 2L" required value={nuevoProd.nombre} onChange={e => setNuevoProd({...nuevoProd, nombre: e.target.value})} className="w-full bg-slate-900 border border-slate-800 px-3.5 py-2.5 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-bold" />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-400 block mb-1">Precio ($)</label>
                    <input type="number" step="0.01" placeholder="0.00" required value={nuevoProd.precio} onChange={e => setNuevoProd({...nuevoProd, precio: e.target.value})} className="w-full bg-slate-900 border border-slate-800 px-3.5 py-2.5 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-bold" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 block mb-1">Categoría</label>
                    <input type="text" placeholder="Ej. Abarrotes" value={nuevoProd.categoria} onChange={e => setNuevoProd({...nuevoProd, categoria: e.target.value})} className="w-full bg-slate-900 border border-slate-800 px-3.5 py-2.5 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-bold" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Proveedor Asociado</label>
                  <select value={nuevoProd.proveedorId} onChange={e => setNuevoProd({...nuevoProd, proveedorId: e.target.value})} className="w-full bg-slate-900 border border-slate-800 px-3.5 py-2.5 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-bold">
                    <option value="">Sin Proveedor</option>
                    {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                </div>

                {/* NUEVO: Checkbox de Disponibilidad */}
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
                  <input type="file" accept="image/*" onChange={e => handleImagenLocal(e, (url) => setNuevoProd({...nuevoProd, imagen: url}))} className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-violet-600 file:text-white hover:file:bg-violet-500 cursor-pointer" />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Descripción</label>
                  <textarea placeholder="Detalles..." value={nuevoProd.descripcion} onChange={e => setNuevoProd({...nuevoProd, descripcion: e.target.value})} className="w-full bg-slate-900 border border-slate-800 px-3.5 py-2.5 rounded-xl text-xs text-white placeholder-slate-500 h-20 focus:outline-none focus:ring-2 focus:ring-violet-500 font-medium" />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-violet-600 hover:bg-violet-500 text-white py-3 rounded-xl font-black text-xs shadow-lg shadow-violet-600/25 transition">
                  {nuevoProd.id ? 'Guardar Cambios' : 'Crear Producto'}
                </button>
                {nuevoProd.id && (
                  <button type="button" onClick={() => setNuevoProd({ id: '', nombre: '', precio: '', categoria: 'Abarrotes', proveedorId: '', imagen: '', descripcion: '', activo: true })} className="bg-slate-800 text-slate-300 px-3 py-3 rounded-xl text-xs font-bold">
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
                  return (
                    <div key={p.id} className={`bg-slate-950 border p-4 rounded-2xl shadow-lg flex items-center justify-between gap-3 ${p.activo === false ? 'border-rose-900/50 opacity-60' : 'border-slate-800'}`}>
                      <img src={p.imagen || FALLBACK_IMG} alt="" className="w-16 h-16 object-cover rounded-xl border border-slate-800 bg-slate-900" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase text-violet-400 bg-violet-950/80 px-2 py-0.5 rounded border border-violet-900/50">{p.categoria}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${p.activo !== false ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'}`}>
                            {p.activo !== false ? 'Disponible' : 'Agotado'}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-white truncate mt-1">{p.nombre}</h4>
                        <p className="text-xs text-slate-400 font-semibold">${precioNum.toFixed(2)} {prov && `• ${prov.nombre}`}</p>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {/* Botón rápido para activar/desactivar */}
                        <button onClick={() => toggleEstadoProducto(p)} className={`p-2 rounded-xl transition ${p.activo !== false ? 'bg-emerald-950 text-emerald-400 hover:bg-emerald-900' : 'bg-rose-950 text-rose-400 hover:bg-rose-900'}`} title={p.activo !== false ? "Desactivar" : "Activar"}>
                          {p.activo !== false ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                        <button onClick={() => setNuevoProd(p)} className="p-2 bg-slate-900 hover:bg-violet-600 hover:text-white rounded-xl text-slate-300 transition" title="Editar">
                          <Edit size={14} />
                        </button>
                        <button onClick={() => eliminarProducto(p.id)} className="p-2 bg-slate-900 hover:bg-rose-600 hover:text-white rounded-xl text-rose-400 transition" title="Eliminar">
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

        {/* RESTO DE TABS (PROVEEDORES Y CONFIG) SE MANTIENEN IGUAL */}
        {tab === 'proveedores' && (
          <div className="bg-slate-950 border border-slate-800 p-8 rounded-3xl shadow-xl max-w-xl space-y-6">
            <div>
              <h3 className="font-black text-lg text-white">Gestión de Proveedores</h3>
              <p className="text-xs text-slate-400">Agrega tiendas externas de las cuales obtienes mercancía.</p>
            </div>
            <form onSubmit={agregarProveedor} className="flex gap-2">
              <input type="text" placeholder="Nombre del proveedor..." required value={nuevoProvNombre} onChange={e => setNuevoProvNombre(e.target.value)} className="flex-1 bg-slate-900 border border-slate-800 px-4 py-3 rounded-2xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-bold" />
              <button type="submit" className="bg-violet-600 hover:bg-violet-500 text-white px-5 rounded-2xl text-xs font-black shadow-lg shadow-violet-600/25 transition">Agregar</button>
            </form>
            <div className="space-y-3">
              {proveedores.map(pr => (
                <div key={pr.id} className="flex items-center justify-between p-4 border border-slate-800 rounded-2xl bg-slate-900 shadow-inner">
                  <h4 className="font-bold text-sm text-white">{pr.nombre}</h4>
                  <button onClick={() => eliminarProveedor(pr.id)} className="text-rose-400 hover:text-rose-300 text-xs font-bold bg-rose-950/50 border border-rose-900/50 px-3 py-1.5 rounded-xl transition">Eliminar</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'config' && (
          <form onSubmit={guardarConfig} className="bg-slate-950 border border-slate-800 p-8 rounded-3xl shadow-xl max-w-xl space-y-5">
            <div>
              <h3 className="font-black text-lg text-white">Ajustes de la Tienda</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Nombre de la Tienda</label>
                <input type="text" value={config.nombreTienda} onChange={e => setConfig({...config, nombreTienda: e.target.value})} className="w-full bg-slate-900 border border-slate-800 px-4 py-3 rounded-2xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-bold" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Teléfono de WhatsApp</label>
                <input type="text" value={config.whatsappTel} onChange={e => setConfig({...config, whatsappTel: e.target.value})} className="w-full bg-slate-900 border border-slate-800 px-4 py-3 rounded-2xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-bold" />
              </div>
            </div>
            <button type="submit" className="w-full bg-violet-600 hover:bg-violet-500 text-white py-3.5 rounded-2xl font-black text-xs shadow-lg shadow-violet-600/25 transition">Guardar Cambios</button>
          </form>
        )}
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, Search, X, MapPin, Phone, User, 
  Check, Store, Sparkles, Tag, ShoppingBag, Flame, Navigation 
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80';

export default function App() {
  const [config, setConfig] = useState({ 
    nombreTienda: 'Mi Tienda Express', 
    subtitulo: 'Surtimos tus pedidos con atención personalizada directamente hasta tu puerta.', 
    logoUrl: '', 
    bannerUrl: '', 
    whatsappTel: '' 
  });
  const [productos, setProductos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [carrito, setCarrito] = useState(() => JSON.parse(localStorage.getItem('store_cart')) || []);

  const [busqueda, setBusqueda] = useState('');
  const [categoriaSel, setCategoriaSel] = useState('Todas');
  const [proveedorSel, setProveedorSel] = useState('Todos');
  const [carritoAbierto, setCarritoAbierto] = useState(false);

  // Datos del Cliente
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [tipoUbicacion, setTipoUbicacion] = useState('direccion');
  const [clienteDireccion, setClienteDireccion] = useState('');
  const [clienteUrlMaps, setClienteUrlMaps] = useState('');
  const [ubicacionGpsUrl, setUbicacionGpsUrl] = useState('');
  const [obteniendoGps, setObteniendoGps] = useState(false);

  // Función para cargar los datos desde la API
  const cargarDatos = async () => {
    try {
      const [resConfig, resProds, resProvs] = await Promise.all([
        axios.get(`${API_URL}/config`),
        axios.get(`${API_URL}/productos`),
        axios.get(`${API_URL}/proveedores`)
      ]);
      if (resConfig.data?.nombreTienda) setConfig(resConfig.data);
      if (resProds.data) setProductos(resProds.data);
      if (resProvs.data) setProveedores(resProvs.data);
    } catch (err) {
      console.error('Error al conectar con la API:', err);
    }
  };

  // Carga inicial y actualización automática cada 4 segundos (Auto-sync)
  useEffect(() => {
    cargarDatos();
    const intervalo = setInterval(cargarDatos, 4000);
    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    localStorage.setItem('store_cart', JSON.stringify(carrito));
  }, [carrito]);

  const agregarAlCarrito = (prod) => {
    setCarrito(prev => {
      const ex = prev.find(i => i.id === prod.id);
      return ex ? prev.map(i => i.id === prod.id ? { ...i, cantidad: i.cantidad + 1 } : i) : [...prev, { ...prod, cantidad: 1 }];
    });
  };

  const modificarCantidad = (id, delta) => {
    setCarrito(prev => prev.map(item => item.id === id ? { ...item, cantidad: Math.max(1, item.cantidad + delta) } : item));
  };

  const eliminarDelCarrito = (id) => setCarrito(prev => prev.filter(i => i.id !== id));
  
  const totalCarrito = carrito.reduce((acc, p) => {
    const precio = typeof p.precio === 'number' ? p.precio : parseFloat(p.precio) || 0;
    return acc + (precio * p.cantidad);
  }, 0);

  // Función para obtener ubicación actual por GPS
  const obtenerUbicacionActual = () => {
    if (!navigator.geolocation) {
      return alert('Tu navegador o dispositivo no soporta geolocalización.');
    }

    setObteniendoGps(true);
    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        const { latitude, longitude } = posicion.coords;
        const linkMaps = `https://www.google.com/maps?q=${latitude},${longitude}`;
        setUbicacionGpsUrl(linkMaps);
        setObteniendoGps(false);
      },
      (error) => {
        setObteniendoGps(false);
        alert('No se pudo obtener tu ubicación. Asegúrate de activar el GPS y dar permisos al navegador.');
        console.error(error);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const enviarPedidoWhatsApp = (e) => {
    e.preventDefault();
    if (!clienteNombre || !clienteTelefono) return alert('Por favor llena tus datos de contacto.');
    if (tipoUbicacion === 'gps' && !ubicacionGpsUrl) {
      return alert('Por favor presiona el botón para obtener tu ubicación GPS actual.');
    }
    
    let msj = `*NUEVO PEDIDO - ${config.nombreTienda.toUpperCase()}*\n\n`;
    msj += `*Cliente:* ${clienteNombre}\n*Teléfono:* ${clienteTelefono}\n`;
    
    if (tipoUbicacion === 'direccion') {
      msj += `*Dirección:* ${clienteDireccion}\n\n`;
    } else if (tipoUbicacion === 'maps') {
      msj += `*Ubicación Maps:* ${clienteUrlMaps}\n\n`;
    } else if (tipoUbicacion === 'gps') {
      msj += `*Ubicación GPS Actual:* ${ubicacionGpsUrl}\n\n`;
    }

    msj += `*DETALLE DEL PEDIDO:*\n`;
    
    carrito.forEach(i => {
      const precioUnit = typeof i.precio === 'number' ? i.precio : parseFloat(i.precio) || 0;
      msj += `• ${i.nombre} x${i.cantidad} - $${(precioUnit * i.cantidad).toFixed(2)}\n`;
    });
    msj += `\n*TOTAL A PAGAR: $${totalCarrito.toFixed(2)}*`;

    const url = `https://wa.me/${config.whatsappTel.replace(/\D/g, '')}?text=${encodeURIComponent(msj)}`;
    window.open(url, '_blank');

    setCarrito([]);
    localStorage.removeItem('store_cart');
    setCarritoAbierto(false);
  };

  const productosFiltrados = productos.filter(p => {
    const estaActivo = p.activo !== false;
    const matchBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || (p.descripcion && p.descripcion.toLowerCase().includes(busqueda.toLowerCase()));
    const matchCat = categoriaSel === 'Todas' || p.categoria === categoriaSel;
    const matchProv = proveedorSel === 'Todos' || p.proveedorId === proveedorSel;
    return estaActivo && matchBusqueda && matchCat && matchProv;
  });

  const categorias = ['Todas', ...new Set(productos.map(p => p.categoria))];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* NAVBAR */}
      <header className="bg-slate-950/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {config.logoUrl ? (
              <img src={config.logoUrl} alt="Logo" className="h-12 w-12 object-contain rounded-2xl shadow-md border border-slate-700 p-1 bg-slate-900" />
            ) : (
              <div className="h-12 w-12 bg-gradient-to-tr from-violet-600 via-fuchsia-600 to-pink-500 text-white flex items-center justify-center font-black rounded-2xl text-xl shadow-lg shadow-purple-500/30">
                {config.nombreTienda.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="font-black text-xl text-white tracking-tight">{config.nombreTienda}</h1>
              <span className="text-xs text-fuchsia-400 font-bold flex items-center gap-1">
                <Sparkles size={13} /> Catálogo Oficial
              </span>
            </div>
          </div>

          <button 
            onClick={() => setCarritoAbierto(true)} 
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-5 py-3 rounded-2xl flex items-center gap-2.5 font-bold shadow-lg shadow-indigo-500/25 transition-all active:scale-95"
          >
            <ShoppingBag size={20} className="text-pink-300" />
            <span className="text-sm">Mi Carrito</span>
            {carrito.length > 0 && (
              <span className="bg-pink-500 text-white text-xs font-black px-2 py-0.5 rounded-full shadow-md">
                {carrito.reduce((acc, item) => acc + item.cantidad, 0)}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* BANNER PRINCIPAL */}
      {config.bannerUrl && (
        <div className="w-full h-56 md:h-80 bg-slate-950 relative overflow-hidden shadow-2xl border-b border-slate-800">
          <img src={config.bannerUrl} alt="Banner" className="w-full h-full object-cover opacity-85" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
        </div>
      )}

      {/* HERO SECTION */}
      <section className="bg-gradient-to-r from-violet-950 via-indigo-950 to-purple-950 py-14 px-4 text-center text-white shadow-inner border-b border-purple-800/40 relative overflow-hidden">
        <div className="max-w-3xl mx-auto space-y-3 relative z-10">
          <span className="bg-white/10 backdrop-blur-md border border-white/20 text-pink-300 text-xs font-black px-4 py-1.5 rounded-full inline-flex items-center gap-1.5 shadow-sm uppercase tracking-wider">
            <Flame size={14} className="text-amber-400" /> Pedidos directos y atención rápida
          </span>
          <h2 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight text-white drop-shadow">
            {config.nombreTienda}
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto font-medium">
            {config.subtitulo}
          </p>
        </div>
      </section>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 flex-grow w-full space-y-8">
        
        {/* BUSCADOR Y FILTROS */}
        <div className="bg-slate-950 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={19} className="absolute left-4 top-3.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Busca productos, categorías..." 
                value={busqueda} 
                onChange={e => setBusqueda(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-700 text-white rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500 font-semibold placeholder-slate-400"
              />
            </div>

            {proveedores.length > 0 && (
              <select 
                value={proveedorSel} 
                onChange={e => setProveedorSel(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white text-sm px-4 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500 font-bold shadow-sm"
              >
                <option value="Todos">📦 Todos los Proveedores</option>
                {proveedores.map(pr => (
                  <option key={pr.id} value={pr.id}>{pr.nombre}</option>
                ))}
              </select>
            )}
          </div>
          
          {/* CATEGORÍAS */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
              <Tag size={13} className="text-fuchsia-400" /> Categorías:
            </span>
            {categorias.map(cat => (
              <button 
                key={cat} 
                onClick={() => setCategoriaSel(cat)} 
                className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all duration-200 ${
                  categoriaSel === cat 
                    ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-lg shadow-fuchsia-600/30' 
                    : 'bg-slate-900 text-slate-200 border border-slate-700 hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* CATÁLOGO DE PRODUCTOS */}
        {productosFiltrados.length === 0 ? (
          <div className="text-center py-20 bg-slate-950 rounded-3xl border border-slate-800 shadow-sm">
            <Search size={48} className="mx-auto text-slate-600 mb-3" />
            <h3 className="text-lg font-bold text-slate-300">No hay productos disponibles</h3>
            <p className="text-xs text-slate-500 mt-1">Intenta con otro término de búsqueda o categoría.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {productosFiltrados.map(prod => {
              const prov = proveedores.find(p => p.id === prod.proveedorId);
              const precioNum = typeof prod.precio === 'number' ? prod.precio : parseFloat(prod.precio) || 0;

              return (
                <div 
                  key={prod.id} 
                  className="group bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden flex flex-col justify-between shadow-xl hover:shadow-2xl hover:border-fuchsia-500/50 transition-all duration-300 hover:-translate-y-1.5"
                >
                  <div className="relative h-52 bg-slate-900 overflow-hidden">
                    <img 
                      src={prod.imagen || FALLBACK_IMG} 
                      onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMG; }}
                      alt={prod.nombre} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                    />
                    {prov && (
                      <span className="absolute top-3 left-3 bg-slate-950/90 backdrop-blur-md text-amber-300 text-[10px] font-black px-3 py-1 rounded-full shadow border border-amber-400/30">
                        ⭐ {prov.nombre}
                      </span>
                    )}
                  </div>
                  
                  <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-pink-400 bg-pink-950/80 px-2.5 py-1 rounded-md border border-pink-800/60">
                        {prod.categoria}
                      </span>
                      <h3 className="font-bold text-base text-white mt-2.5 leading-snug line-clamp-2">{prod.nombre}</h3>
                      {prod.descripcion && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{prod.descripcion}</p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-black uppercase">Precio</span>
                        <span className="text-2xl font-black text-white">${precioNum.toFixed(2)}</span>
                      </div>
                      <button 
                        onClick={() => agregarAlCarrito(prod)} 
                        className="bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-1.5 shadow-lg shadow-fuchsia-600/25 active:scale-95 transition"
                      >
                        <Plus size={16} /> Agregar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* CARRITO DE COMPRAS */}
      {carritoAbierto && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-slate-950 text-white w-full max-w-md h-full flex flex-col shadow-2xl border-l border-slate-800">
            {/* Header Carrito */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900">
              <h3 className="font-black text-lg text-white flex items-center gap-2">
                <ShoppingBag className="text-pink-400" size={22} /> Tu Carrito de Compras
              </h3>
              <button 
                onClick={() => setCarritoAbierto(false)} 
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Ítems del Carrito */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
              {carrito.length === 0 ? (
                <div className="text-center py-20 text-slate-500">
                  <ShoppingBag size={52} className="mx-auto mb-3 opacity-30 text-pink-500" />
                  <p className="font-bold text-slate-300 text-base">Tu carrito está vacío</p>
                  <p className="text-xs mt-1 text-slate-500">Selecciona productos para armar tu pedido.</p>
                </div>
              ) : (
                carrito.map(item => {
                  const precioItem = typeof item.precio === 'number' ? item.precio : parseFloat(item.precio) || 0;
                  return (
                    <div key={item.id} className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex gap-3.5 items-center shadow-sm">
                      <img 
                        src={item.imagen || FALLBACK_IMG} 
                        onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMG; }}
                        alt="" 
                        className="w-14 h-14 object-cover rounded-xl border border-slate-700 bg-slate-950" 
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-white truncate">{item.nombre}</h4>
                        <p className="text-xs text-pink-400 font-bold mt-0.5">${precioItem.toFixed(2)} c/u</p>
                        
                        <div className="flex items-center gap-2.5 mt-2">
                          <div className="flex items-center border border-slate-700 rounded-xl bg-slate-950">
                            <button onClick={() => modificarCantidad(item.id, -1)} className="px-2.5 py-1 text-slate-300 text-xs font-black hover:bg-slate-800 rounded-l-xl">-</button>
                            <span className="px-2.5 text-xs font-black text-white">{item.cantidad}</span>
                            <button onClick={() => modificarCantidad(item.id, 1)} className="px-2.5 py-1 text-slate-300 text-xs font-black hover:bg-slate-800 rounded-r-xl">+</button>
                          </div>
                          <button onClick={() => eliminarDelCarrito(item.id)} className="text-xs text-rose-400 hover:text-rose-300 font-bold">
                            Eliminar
                          </button>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-base text-white">${(precioItem * item.cantidad).toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Formulario de Checkout */}
            {carrito.length > 0 && (
              <form onSubmit={enviarPedidoWhatsApp} className="p-5 border-t border-slate-800 bg-slate-900 space-y-4">
                <div className="flex justify-between items-center text-lg font-black text-white border-b border-slate-800 pb-3">
                  <span>Total a Pagar:</span>
                  <span className="text-pink-400 text-2xl font-black">${totalCarrito.toFixed(2)}</span>
                </div>

                <div className="space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Datos para la Entrega</span>
                  
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                    <input 
                      type="text" required placeholder="Nombre Completo *" 
                      value={clienteNombre} onChange={e => setClienteNombre(e.target.value)} 
                      className="w-full pl-10 pr-3.5 py-3 bg-slate-950 border border-slate-700 rounded-2xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 font-bold" 
                    />
                  </div>

                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                    <input 
                      type="tel" required placeholder="Teléfono de Contacto *" 
                      value={clienteTelefono} onChange={e => setClienteTelefono(e.target.value)} 
                      className="w-full pl-10 pr-3.5 py-3 bg-slate-950 border border-slate-700 rounded-2xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 font-bold" 
                    />
                  </div>

                  <select 
                    value={tipoUbicacion} onChange={e => setTipoUbicacion(e.target.value)} 
                    className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3 text-xs text-white font-bold focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                  >
                    <option value="direccion">📍 Escribir Dirección Normal</option>
                    <option value="maps">🗺️ Pegar URL de Google Maps</option>
                    <option value="gps">📡 Usar mi ubicación actual (GPS)</option>
                  </select>

                  {tipoUbicacion === 'direccion' && (
                    <textarea 
                      required
                      placeholder="Calle, número, colonia, referencias..." 
                      value={clienteDireccion} onChange={e => setClienteDireccion(e.target.value)} 
                      className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3 text-xs text-white placeholder-slate-400 h-16 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 font-bold" 
                    />
                  )}

                  {tipoUbicacion === 'maps' && (
                    <div className="relative">
                      <MapPin size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                      <input 
                        type="url" required placeholder="https://maps.google.com/..." 
                        value={clienteUrlMaps} onChange={e => setClienteUrlMaps(e.target.value)} 
                        className="w-full pl-10 pr-3.5 py-3 bg-slate-950 border border-slate-700 rounded-2xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 font-bold" 
                      />
                    </div>
                  )}

                  {tipoUbicacion === 'gps' && (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={obtenerUbicacionActual}
                        disabled={obteniendoGps}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-bold py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 transition shadow-md"
                      >
                        <Navigation size={15} className={obteniendoGps ? 'animate-spin' : ''} />
                        {obteniendoGps ? 'Detectando ubicación GPS...' : ubicacionGpsUrl ? '🔄 Actualizar mi ubicación actual' : '📍 Obtener mi ubicación actual'}
                      </button>
                      
                      {ubicacionGpsUrl && (
                        <div className="bg-emerald-950/60 border border-emerald-700/60 rounded-xl p-2.5 text-[11px] text-emerald-300 flex items-center justify-between gap-2">
                          <span className="truncate font-semibold">✅ Ubicación lista para enviar</span>
                          <a href={ubicacionGpsUrl} target="_blank" rel="noreferrer" className="underline font-black text-emerald-200 shrink-0">
                            Ver mapa
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  <button 
                    type="submit" 
                    className="w-full bg-[#25D366] hover:bg-[#1ebe5d] text-black font-black py-4 rounded-2xl flex items-center justify-center gap-2.5 shadow-xl shadow-green-500/20 active:scale-95 transition text-sm mt-2"
                  >
                    <Check size={20} className="text-black stroke-[3]" /> Enviar Pedido por WhatsApp
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-slate-950 border-t border-slate-800 py-6 text-center text-xs text-slate-400 font-medium">
        <p>© 2026 Tienda Virtual. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
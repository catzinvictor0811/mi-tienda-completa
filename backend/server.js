const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'secreto_super_seguro_admin123';

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// --- CONEXIÓN A MONGODB ATLAS ---
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb+srv://catzinvictor0811_db_user:LerizPwJlfpPA4n@cluster0.nhe3gow.mongodb.net/?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI)
  .then(() => console.log('Conectado a MongoDB Atlas con éxito'))
  .catch(err => console.error('Error al conectar a MongoDB:', err));

// --- ESQUEMAS Y MODELOS DE MONGOOSE ---
const configSchema = new mongoose.Schema({
  nombreTienda: String,
  subtitulo: String,
  logoUrl: String,
  bannerUrl: String,
  whatsappTel: String
});
const Config = mongoose.model('Config', configSchema);

const proveedorSchema = new mongoose.Schema({
  nombre: String
});
const Proveedor = mongoose.model('Proveedor', proveedorSchema);

const productoSchema = new mongoose.Schema({
  nombre: String,
  precio: Number,
  categoria: String,
  proveedorId: String,
  imagen: String,
  descripcion: String,
  activo: { type: Boolean, default: true }
});
const Producto = mongoose.model('Producto', productoSchema);

// Middleware de Autenticación para el Admin
const verificarTokenAdmin = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ error: 'Acceso denegado' });

  try {
    const verified = jwt.verify(token.replace('Bearer ', ''), JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Token inválido' });
  }
};

// ==========================================
// RUTAS PÚBLICAS (Para la Tienda Cliente)
// ==========================================

// Obtener configuración de la tienda (si no existe, crea una por defecto)
app.get('/api/config', async (req, res) => {
  try {
    let config = await Config.findOne();
    if (!config) {
      config = await Config.create({
        nombreTienda: 'Mi Tienda Express',
        subtitulo: 'Surtimos tus pedidos con atención personalizada directamente hasta tu puerta.',
        whatsappTel: '5215555555555',
        logoUrl: '',
        bannerUrl: ''
      });
    }
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener la configuración' });
  }
});

// Obtener catálogo de productos
app.get('/api/productos', async (req, res) => {
  try {
    const productos = await Producto.find();
    res.json(productos);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener los productos' });
  }
});

// Obtener lista de proveedores
app.get('/api/proveedores', async (req, res) => {
  try {
    const proveedores = await Proveedor.find();
    res.json(proveedores);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener los proveedores' });
  }
});

// Login del Administrador
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === '191423') {
    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '8h' });
    return res.json({ token });
  }
  res.status(401).json({ error: 'Contraseña incorrecta' });
});

// ==========================================
// RUTAS PRIVADAS (Solo Administrador)
// ==========================================

// Actualizar configuración
app.put('/api/admin/config', verificarTokenAdmin, async (req, res) => {
  try {
    let config = await Config.findOne();
    if (!config) {
      config = await Config.create(req.body);
    } else {
      Object.assign(config, req.body);
      await config.save();
    }
    res.json({ mensaje: 'Configuración actualizada', config });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar configuración' });
  }
});

// Crear producto
app.post('/api/admin/productos', verificarTokenAdmin, async (req, res) => {
  try {
    const nuevoProd = await Producto.create({
      ...req.body,
      precio: parseFloat(req.body.precio)
    });
    res.json({ mensaje: 'Producto creado', producto: nuevoProd });
  } catch (err) {
    res.status(500).json({ error: 'Error al crear el producto' });
  }
});

// Editar producto
app.put('/api/admin/productos/:id', verificarTokenAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const productoActualizado = await Producto.findByIdAndUpdate(
      id, 
      { ...req.body, precio: parseFloat(req.body.precio) }, 
      { new: true }
    );
    res.json({ mensaje: 'Producto actualizado', producto: productoActualizado });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar el producto' });
  }
});

// Eliminar producto
app.delete('/api/admin/productos/:id', verificarTokenAdmin, async (req, res) => {
  try {
    await Producto.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Producto eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar el producto' });
  }
});

// Crear proveedor
app.post('/api/admin/proveedores', verificarTokenAdmin, async (req, res) => {
  try {
    const nuevoProv = await Proveedor.create({ nombre: req.body.nombre });
    res.json({ mensaje: 'Proveedor agregado', proveedor: nuevoProv });
  } catch (err) {
    res.status(500).json({ error: 'Error al agregar proveedor' });
  }
});

// Eliminar proveedor
app.delete('/api/admin/proveedores/:id', verificarTokenAdmin, async (req, res) => {
  try {
    await Proveedor.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Proveedor eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar proveedor' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor API ejecutándose en http://localhost:${PORT}`);
});
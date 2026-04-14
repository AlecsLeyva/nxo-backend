require('dotenv').config(); // Por si usas archivo .env para tus variables
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// ==========================================
// CONFIGURACIÓN DE SUPABASE
// ==========================================
// ¡OJO! Pon tus llaves reales aquí antes de subir a GitHub:
const supabaseUrl = process.env.SUPABASE_URL || 'https://pvhzcyvvtqmceovlqhvp.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2aHpjeXZ2dHFtY2VvdmxxaHZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMDIzNzYsImV4cCI6MjA4ODc3ODM3Nn0.aDIHrpif7I2l5rYkSwjFbzylg18vdysy2TIy8VoI9RU';
const supabase = createClient(supabaseUrl, supabaseKey);

// ==========================================
// RUTAS (ENDPOINTS)
// ==========================================

// 0. RUTA PRINCIPAL
app.get('/', (req, res) => {
    res.send('¡El servidor de NXO Teatro está funcionando perfectamente! 🎭');
});

// 1. Cartelera Principal
app.get('/cartelera', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('obras')
            .select('titulo, categoria, duracion, imagen_url');
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// 2. Detalles de la obra
app.get('/obra-detalle/:titulo', async (req, res) => {
    const tituloObra = req.params.titulo;
    try {
        const { data, error } = await supabase
            .from('obras')
            .select('*')
            .eq('titulo', tituloObra)
            .single();
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(404).json({ error: "Obra no encontrada" });
    }
});

// 3. Obtener asientos ocupados (Pintar de rojo)
app.get('/asientos-ocupados', async (req, res) => {
    const { titulo, horario } = req.query;
    try {
        const { data, error } = await supabase
            .from('reservas')
            .select('asiento')
            .eq('obra', titulo)
            .eq('horario', horario);

        if (error) throw error;

        const asientosOcupados = data.map(reserva => reserva.asiento);
        res.json(asientosOcupados);
    } catch (error) {
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// 4. Guardar nueva reserva
app.post('/reservar', async (req, res) => {
    const { obra, horario, asientos, usuario_email } = req.body;
    try {
        const insertData = asientos.map(asiento => ({
            obra: obra,
            horario: horario,
            asiento: asiento,
            usuario_email: usuario_email || 'martin@gmail.com' 
        }));

        const { data, error } = await supabase
            .from('reservas')
            .insert(insertData);

        if (error) throw error;
        
        res.json({ success: true, message: 'Reserva guardada con éxito' });
    } catch (error) {
        res.status(500).json({ error: "Error al guardar en la base de datos" });
    }
});

// 5. Obtener el historial de boletos de un usuario
app.get('/mis-boletos', async (req, res) => {
    const emailUsuario = req.query.email || 'martin@gmail.com';

    try {
        const { data, error } = await supabase
            .from('reservas')
            .select('obra, horario, asiento')
            .eq('usuario_email', emailUsuario); 

        if (error) throw error;
        
        res.json(data);
    } catch (error) {
        console.error("Error al obtener historial:", error);
        res.status(500).json({ error: "Error al cargar el historial" });
    }
});

// 6. Registrar nuevo usuario
app.post('/usuarios', async (req, res) => {
    const { email, password } = req.body;
    try {
        const { data, error } = await supabase
            .from('usuarios')
            .insert([{ email: email, password: password }]);

        if (error) throw error;
        res.json({ success: true, message: 'Usuario registrado' });
    } catch (error) {
        res.status(500).json({ error: "Error al guardar usuario" });
    }
});

// 7. ¡LA RUTA PERDIDA! Iniciar Sesión (Login)
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('email', email)
            .eq('password', password)
            .single(); 

        if (error || !data) {
            return res.status(401).json({ error: "Credenciales incorrectas" });
        }
        
        res.json({ success: true, message: 'Login exitoso', usuario: data.email });
    } catch (error) {
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// ==========================================
// INICIAR EL SERVIDOR
// ==========================================
app.listen(port, () => {
    console.log(`Servidor de NXO Teatro corriendo en el puerto ${port}`);
});

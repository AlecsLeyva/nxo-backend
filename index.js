const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// Permite que otras aplicaciones (como tu app de Android o tu Arduino) se conecten
app.use(cors());
// Permite que el servidor entienda datos en formato JSON
app.use(express.json());

// --- CONEXIÓN A SUPABASE ---
const supabaseUrl = 'https://pvhzcyvvtqmceovlqhvp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2aHpjeXZ2dHFtY2VvdmxxaHZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMDIzNzYsImV4cCI6MjA4ODc3ODM3Nn0.aDIHrpif7I2l5rYkSwjFbzylg18vdysy2TIy8VoI9RU';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- RUTAS DEL SERVIDOR ---

// 1. Ruta de prueba para ver si el servidor está encendido
app.get('/', (req, res) => {
    res.send('¡El servidor central de NXO Teatro está funcionando perfectamente!');
});

// 2. Ruta para probar si logró entrar a tu base de datos en Supabase
app.get('/probar-bd', async (req, res) => {
    const { data, error } = await supabase.from('usuarios').select('*');
    if (error) {
        return res.status(500).json({ error: "Error conectando a Supabase: " + error.message });
    }
    res.json({ mensaje: "Conexión a Supabase EXITOSA", datos: data });
});

// 3. NUEVA: Guardar Reserva (La usa tu App de Android)
app.post('/reservar', async (req, res) => {
    const { obra, horario, asiento, usuario_email } = req.body;
    
    // Le decimos a Supabase que inserte una nueva fila en la tabla 'reservas'
    const { data, error } = await supabase
        .from('reservas')
        .insert([{ obra, horario, asiento, usuario_email }]);
        
    if (error) {
        return res.status(400).json({ exito: false, error: error.message });
    }
    res.json({ exito: true, mensaje: 'Reserva guardada en la nube exitosamente' });
});

// 4. NUEVA: Validar QR (La usará tu ESP32/Arduino en el torniquete físico)
app.post('/validar-qr', async (req, res) => {
    const { obra, asiento } = req.body;
    
    // Buscamos si existe ese asiento exacto para esa obra en Supabase
    const { data, error } = await supabase
        .from('reservas')
        .select('*')
        .eq('obra', obra)
        .eq('asiento', asiento);
        
    if (error) {
        return res.status(400).json({ error: error.message });
    }
    
    if (data.length > 0) {
        res.json({ acceso: true, mensaje: 'ACCESO PERMITIDO: Abriendo torniquete...' });
    } else {
        res.json({ acceso: false, mensaje: 'ACCESO DENEGADO: Boleto inválido.' });
    }
});

// --- ENCENDER EL SERVIDOR ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

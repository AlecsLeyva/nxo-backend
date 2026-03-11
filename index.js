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
    // Intenta leer la tabla "usuarios" (que ahorita está vacía)
    const { data, error } = await supabase.from('usuarios').select('*');
    
    if (error) {
        return res.status(500).json({ error: "Error conectando a Supabase: " + error.message });
    }
    res.json({ mensaje: "Conexión a Supabase EXITOSA", datos: data });
});

// --- ENCENDER EL SERVIDOR ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
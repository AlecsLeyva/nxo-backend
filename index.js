const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// Middleware: Permite conexiones externas y lectura de JSON
app.use(cors());
app.use(express.json());

// --- CONEXIÓN A SUPABASE ---
// Mantengo tus credenciales actuales
const supabaseUrl = 'https://pvhzcyvvtqmceovlqhvp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2aHpjeXZ2dHFtY2VvdmxxaHZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMDIzNzYsImV4cCI6MjA4ODc3ODM3Nn0.aDIHrpif7I2l5rYkSwjFbzylg18vdysy2TIy8VoI9RU';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- RUTAS DEL SERVIDOR ---

// 1. Verificación de servidor encendido
app.get('/', (req, res) => {
    res.send('¡El servidor central de NXO Teatro está funcionando perfectamente!');
});

// 2. Ruta para obtener la CARTELERA (Usada por Android MainActivity)
app.get('/cartelera', async (req, res) => {
    const { data, error } = await supabase
        .from('obras')
        .select('*')
        .order('id', { ascending: true });

    if (error) {
        return res.status(400).json({ error: error.message });
    }
    res.json(data);
});

// 3. Registro de Usuarios (Usada por RegistroActivity)
app.post('/usuarios', async (req, res) => {
    const { email, password } = req.body;
    const { data, error } = await supabase
        .from('usuarios')
        .insert([{ email, password }]);
        
    if (error) {
        return res.status(400).json({ exito: false, error: error.message });
    }
    res.json({ exito: true, mensaje: 'Usuario guardado en la nube exitosamente' });
});

// 4. Guardar Reservas de Asientos (Usada por MapaAsientosActivity)
app.post('/reservar', async (req, res) => {
    const { obra, horario, asiento, usuario_email } = req.body;
    const { data, error } = await supabase
        .from('reservas')
        .insert([{ obra, horario, asiento, usuario_email }]);
        
    if (error) {
        return res.status(400).json({ exito: false, error: error.message });
    }
    res.json({ exito: true, mensaje: 'Reserva guardada en la nube exitosamente' });
});

// 5. Validación de QR (Para el Hardware/Torniquete futuro)
app.post('/validar-qr', async (req, res) => {
    const { obra, asiento } = req.body;
    const { data, error } = await supabase
        .from('reservas')
        .select('*')
        .eq('obra', obra)
        .eq('asiento', asiento);
        
    if (error) {
        return res.status(400).json({ error: error.message });
    }
    
    if (data.length > 0) {
        res.json({ acceso: true, mensaje: 'ACCESO PERMITIDO' });
    } else {
        res.json({ acceso: false, mensaje: 'ACCESO DENEGADO' });
    }
});

// --- ENCENDER EL SERVIDOR ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});

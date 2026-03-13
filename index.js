const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();

app.use(cors());
app.use(express.json());

// --- CONEXIÓN A SUPABASE ---
const supabaseUrl = 'https://pvhzcyvvtqmceovlqhvp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2aHpjeXZ2dHFtY2VvdmxxaHZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMDIzNzYsImV4cCI6MjA4ODc3ODM3Nn0.aDIHrpif7I2l5rYkSwjFbzylg18vdysy2TIy8VoI9RU';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- RUTAS ---

app.get('/', (req, res) => {
    res.send('Servidor NXO Teatro - Activo');
});

// 1. OBTENER TODA LA CARTELERA (Para el RecyclerView de MainActivity)
app.get('/cartelera', async (req, res) => {
    const { data, error } = await supabase
        .from('obras')
        .select('*')
        .order('id', { ascending: true });

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// 2. NUEVA: OBTENER DETALLE DE UNA OBRA (Para DetalleObraActivity)
// Buscamos por título para traer sinopsis, categoría y duración
app.get('/obra-detalle/:titulo', async (req, res) => {
    const { titulo } = req.params;
    const { data, error } = await supabase
        .from('obras')
        .select('*')
        .eq('titulo', titulo)
        .single(); // Trae solo un objeto, no una lista

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// 3. REGISTRO DE USUARIOS
app.post('/usuarios', async (req, res) => {
    const { email, password } = req.body;
    const { data, error } = await supabase.from('usuarios').insert([{ email, password }]);
    if (error) return res.status(400).json({ exito: false, error: error.message });
    res.json({ exito: true });
});

// 4. GUARDAR RESERVAS
app.post('/reservar', async (req, res) => {
    const { obra, horario, asiento, usuario_email } = req.body;
    const { data, error } = await supabase.from('reservas').insert([{ obra, horario, asiento, usuario_email }]);
    if (error) return res.status(400).json({ exito: false, error: error.message });
    res.json({ exito: true });
});

// 5. VALIDACIÓN QR (HARDWARE)
app.post('/validar-qr', async (req, res) => {
    const { obra, asiento } = req.body;
    const { data, error } = await supabase.from('reservas').select('*').eq('obra', obra).eq('asiento', asiento);
    res.json({ acceso: data && data.length > 0 });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Corriendo en puerto ${PORT}`));

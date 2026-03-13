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
const supabaseUrl = process.env.SUPABASE_URL || 'TU_URL_DE_SUPABASE';
const supabaseKey = process.env.SUPABASE_KEY || 'TU_KEY_DE_SUPABASE';
const supabase = createClient(supabaseUrl, supabaseKey);

// ==========================================
// RUTAS (ENDPOINTS)
// ==========================================

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

// 4. Guardar nueva reserva (La nueva ruta POST)
app.post('/reservar', async (req, res) => {
    const { obra, horario, asientos, usuario_email } = req.body;
    try {
        // Transformamos la lista ["F2", "F3"] en formato para Supabase
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

app.listen(port, () => {
    console.log(`Servidor de NXO Teatro corriendo en el puerto ${port}`);
});

// Importamos las librerías necesarias
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

// Configuramos la aplicación de Express
const app = express();
const port = process.env.PORT || 3000;

// Middleware para aceptar peticiones en formato JSON y evitar errores de CORS
app.use(express.json());
app.use(cors());

// ==========================================
// CONFIGURACIÓN DE SUPABASE
// ==========================================
// Recuerda usar tus credenciales reales aquí o en tus variables de entorno (.env)
const supabaseUrl = process.env.SUPABASE_URL || 'TU_URL_DE_SUPABASE';
const supabaseKey = process.env.SUPABASE_KEY || 'TU_KEY_DE_SUPABASE';
const supabase = createClient(supabaseUrl, supabaseKey);


// ==========================================
// RUTAS DE LA APLICACIÓN (ENDPOINTS)
// ==========================================

// 1. RUTA: Obtener todas las obras para la Cartelera Principal
app.get('/cartelera', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('obras')
            .select('titulo, categoria, duracion, imagen_url'); // Pedimos la foto también

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error("Error al obtener la cartelera:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// 2. RUTA: Obtener los detalles y la sinopsis de una obra específica
app.get('/obra-detalle/:titulo', async (req, res) => {
    // Extraemos el título de la URL
    const tituloObra = req.params.titulo;

    try {
        const { data, error } = await supabase
            .from('obras')
            .select('*')
            .eq('titulo', tituloObra)
            .single(); // single() porque solo queremos una obra, no un arreglo

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error("Error al obtener detalles de la obra:", error);
        res.status(404).json({ error: "Obra no encontrada" });
    }
});

// 3. RUTA: Obtener los asientos que ya están ocupados (¡LA NUEVA RUTA!)
app.get('/asientos-ocupados', async (req, res) => {
    // Recibimos el nombre de la obra y el horario desde Android
    const { titulo, horario } = req.query;

    try {
        // Buscamos en tu tabla 'reservas' los asientos que coincidan
        const { data, error } = await supabase
            .from('reservas')
            .select('asiento')
            .eq('obra', titulo) // Busca en tu columna 'obra'
            .eq('horario', horario);

        if (error) throw error;

        // Convertimos el resultado en una lista simple, ej: ["A1", "D6", "F3"]
        const asientosOcupados = data.map(reserva => reserva.asiento);
        
        // Enviamos la lista de asientos bloqueados a la app
        res.json(asientosOcupados);
        
    } catch (error) {
        console.error("Error al buscar asientos ocupados:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// ==========================================
// INICIAR EL SERVIDOR
// ==========================================
app.listen(port, () => {
    console.log(`Servidor de NXO Teatro corriendo exitosamente en el puerto ${port}`);
});

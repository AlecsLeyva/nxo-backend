require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// ==========================================
// CONFIGURACIÓN DE SUPABASE
// ==========================================
const supabaseUrl = process.env.SUPABASE_URL || 'https://pvhzcyvvtqmceovlqhvp.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2aHpjeXZ2dHFtY2VvdmxxaHZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMDIzNzYsImV4cCI6MjA4ODc3ODM3Nn0.aDIHrpif7I2l5rYkSwjFbzylg18vdysy2TIy8VoI9RU';
const supabase = createClient(supabaseUrl, supabaseKey);

// ==========================================
// RUTAS DE CLIENTE
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
            .select('id, titulo, categoria, duracion, sinopsis, imagen_url');
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

// 3. Obtener asientos ocupados
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
            usuario_email: usuario_email || 'martin@gmail.com',
            escaneado: false
        }));

        const { data, error } = await supabase
            .from('reservas')
            .insert(insertData);

        // AQUÍ ATRAPAMOS EL CHOQUE
        if (error) {
            // El código 23505 en PostgreSQL significa "Violación de Restricción Única" (Alguien ya lo compró)
            if (error.code === '23505') {
                return res.status(409).json({ error: "¡Ups! Alguien más compró uno de estos asientos hace un instante. Por favor, actualiza el mapa." });
            }
            throw error;
        }
        
        res.json({ success: true, message: 'Reserva guardada con éxito' });
    } catch (error) {
        res.status(500).json({ error: "Error al guardar en la base de datos" });
    }
});
// 5. Obtener el historial de boletos
app.get('/mis-boletos', async (req, res) => {
    const emailUsuario = req.query.email || 'martin@gmail.com';
    try {
        const { data, error } = await supabase
            .from('reservas')
            .select('id, obra, horario, asiento')
            .eq('usuario_email', emailUsuario); 

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Error al cargar el historial" });
    }
});

// 6. Registrar nuevo usuario 
app.post('/usuarios', async (req, res) => {
    const { email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const { data, error } = await supabase
            .from('usuarios')
            .insert([{ email: email, password: hashedPassword }]);

        if (error) throw error;
        res.json({ success: true, message: 'Usuario registrado' });
    } catch (error) {
        res.status(500).json({ error: "Error al guardar usuario" });
    }
});

// 7. Iniciar Sesión 
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('email', email)
            .single(); 

        if (error || !data) return res.status(401).json({ error: "Credenciales incorrectas" });

        const passwordValida = await bcrypt.compare(password, data.password);
        if (!passwordValida) return res.status(401).json({ error: "Credenciales incorrectas" });
        
        res.json({ success: true, message: 'Login exitoso', usuario: data.email });
    } catch (error) {
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// ==========================================
// RUTAS DE ADMINISTRADOR
// ==========================================

// 8. Estadísticas del Dashboard
app.get('/admin/stats', async (req, res) => {
    try {
        const { count: obrasCount, error: errorObras } = await supabase
            .from('obras')
            .select('*', { count: 'exact', head: true });

        const { count: reservasCount, error: errorReservas } = await supabase
            .from('reservas')
            .select('*', { count: 'exact', head: true });

        if (errorObras || errorReservas) throw new Error("Error en Supabase");
        res.json({ obrasActivas: obrasCount || 0, boletosVendidos: reservasCount || 0 });
    } catch (error) {
        res.status(500).json({ error: "Error al obtener estadísticas" });
    }
});

// 9. Ver todas las reservas (Historial Global)
app.get('/todas-reservas', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('reservas')
            .select('*')
            .order('id', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Error al cargar todas las reservas" });
    }
});

// 10. Registrar nueva obra (CREATE)
app.post('/obras', async (req, res) => {
    const { titulo, categoria, duracion, sinopsis, imagen_url } = req.body;
    try {
        const { data, error } = await supabase
            .from('obras')
            .insert([{ titulo, categoria, duracion, sinopsis, imagen_url }]);

        if (error) throw error;
        res.json({ success: true, message: 'Obra registrada con éxito' });
    } catch (error) {
        res.status(500).json({ error: "Error al registrar la obra" });
    }
});

// 11. Editar obra (UPDATE)
app.put('/obras/:id', async (req, res) => {
    const { id } = req.params;
    const { titulo, categoria, duracion, sinopsis, imagen_url } = req.body;
    try {
        const { data, error } = await supabase
            .from('obras')
            .update({ titulo, categoria, duracion, sinopsis, imagen_url })
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true, message: 'Obra actualizada correctamente' });
    } catch (error) {
        res.status(500).json({ error: "Error al actualizar la obra" });
    }
});

// 12. Borrar obra (DELETE)
app.delete('/obras/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { error } = await supabase
            .from('obras')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true, message: 'Obra eliminada con éxito' });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar la obra" });
    }
});

// 13. Validar Boleto QR (¡LA NUEVA RUTA!)
app.put('/reservas/escanear/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // 1. Buscamos el boleto
        const { data: reserva, error: selectError } = await supabase
            .from('reservas')
            .select('escaneado')
            .eq('id', id)
            .single();

        if (selectError || !reserva) {
            return res.status(404).json({ error: "Boleto no encontrado en la base de datos." });
        }

        // 2. Revisamos si ya entró
        if (reserva.escaneado === true) {
            return res.status(400).json({ error: "❌ ALERTA: Este boleto YA FUE ESCANEADO." });
        }

        // 3. Le damos acceso y lo marcamos como escaneado
        const { error: updateError } = await supabase
            .from('reservas')
            .update({ escaneado: true })
            .eq('id', id);

        if (updateError) throw updateError;
        res.json({ success: true, message: '✅ ACCESO CONCEDIDO. Boleto validado.' });
        
    } catch (error) {
        res.status(500).json({ error: "Error en el servidor al validar el boleto." });
    }
});
// 14. Cancelar Reserva (Cliente)
app.post('/reservas/cancelar', async (req, res) => {
    const { ids } = req.body; // Recibe una lista de IDs para borrar al mismo tiempo
    try {
        const { error } = await supabase
            .from('reservas')
            .delete()
            .in('id', ids);

        if (error) throw error;
        res.json({ success: true, message: 'Reserva cancelada y asientos liberados' });
    } catch (error) {
        res.status(500).json({ error: "Error al cancelar la reserva en la base de datos" });
    }
});
// ==========================================
// INICIAR EL SERVIDOR
// ==========================================
app.listen(port, () => {
    console.log(`Servidor de NXO Teatro corriendo en el puerto ${port}`);
});

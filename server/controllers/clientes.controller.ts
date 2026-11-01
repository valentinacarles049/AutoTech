import { Request, Response } from 'express';
import { supabase, isSupabaseConnected, localClientsSeed, LocalClient, getNextClientNumber } from '../db';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * HU-04: Registrar Cliente
 * 
 * Criterios de Aceptación:
 * 1. Campos obligatorios: nombre, apellido, tipo y número de documento, mail y teléfono
 * 2. Razón social opcional (clientes empresa)
 * 3. No se permite duplicar tipo y número de documento
 * 4. El mail debe tener formato válido
 * 5. El sistema registra el cliente con un número de cliente
 * 6. El cliente queda sin nivel de fidelización asignado (null)
 */
export const registrarCliente = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      nombre,
      apellido,
      tipo_documento,
      tipoDocumento,
      numero_documento,
      nro_documento,
      nroDocumento,
      mail,
      email,
      telefono,
      phone,
      razon_social,
      razonSocial,
      localidad
    } = req.body;

    const valNombre = (nombre || '').toString().trim();
    const valApellido = (apellido || '').toString().trim();
    const valTipoDoc = (tipo_documento || tipoDocumento || '').toString().trim().toUpperCase();
    const valNroDoc = (numero_documento || nro_documento || nroDocumento || '').toString().trim();
    const valEmail = (mail || email || '').toString().trim().toLowerCase();
    const valTelefono = (telefono || phone || '').toString().trim();
    const valRazonSocial = (razon_social || razonSocial || '').toString().trim();
    const valLocalidad = (localidad || '').toString().trim();

    // Criterio 1: Campos obligatorios
    if (!valNombre || !valApellido || !valTipoDoc || !valNroDoc || !valEmail || !valTelefono) {
      res.status(400).json({
        error: 'Los campos nombre, apellido, tipo y número de documento, mail y teléfono son obligatorios'
      });
      return;
    }

    // Criterio 4: El mail debe tener formato válido
    if (!EMAIL_REGEX.test(valEmail)) {
      res.status(400).json({
        error: 'El mail debe tener formato válido'
      });
      return;
    }

    // Criterio 3: No se permite duplicar tipo y número de documento
    // 1. Verificar en Supabase si está activo
    if (isSupabaseConnected && supabase) {
      try {
        const { data: existingDb } = await supabase
          .from('clientes')
          .select('id, tipo_documento, nro_documento')
          .ilike('tipo_documento', valTipoDoc)
          .eq('nro_documento', valNroDoc)
          .maybeSingle();

        if (existingDb) {
          res.status(409).json({
            error: 'Ya existe un cliente con ese tipo y número de documento'
          });
          return;
        }
      } catch (err) {
        console.warn('[Backend Clientes] Error comprobando duplicados en Supabase:', err);
      }
    }

    // 2. Verificar en memoria / semilla local
    const existingLocal = localClientsSeed.find(c => 
      c.tipo_documento.toUpperCase() === valTipoDoc && 
      c.nro_documento === valNroDoc
    );

    if (existingLocal) {
      res.status(409).json({
        error: 'Ya existe un cliente con ese tipo y número de documento'
      });
      return;
    }

    // Asignación de número de cliente y registro
    const nroCliente = getNextClientNumber();
    const nuevoId = `cli-${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];

    const nuevoCliente: LocalClient = {
      id: nuevoId,
      nro_cliente: nroCliente,
      nombre: valNombre,
      apellido: valApellido,
      tipo_documento: valTipoDoc as 'DNI' | 'CUIT' | 'Pasaporte',
      nro_documento: valNroDoc,
      razon_social: valRazonSocial || null,
      email: valEmail,
      telefono: valTelefono,
      localidad: valLocalidad || null,
      nivel_fidelizacion: null, // Sin nivel de fidelización asignado
      fecha_alta: today,
      estado: 'Activo'
    };

    // Intentar persistir en Supabase
    if (isSupabaseConnected && supabase) {
      try {
        const { data: dbCreated, error: dbErr } = await supabase
          .from('clientes')
          .insert([{
            nombre: valNombre,
            apellido: valApellido,
            tipo_documento: valTipoDoc,
            nro_documento: valNroDoc,
            razon_social: valRazonSocial || null,
            email: valEmail,
            telefono: valTelefono,
            localidad: valLocalidad || null,
            nivel_fidelizacion: null,
            estado: 'Activo'
          }])
          .select()
          .single();

        if (dbCreated && !dbErr) {
          nuevoCliente.id = dbCreated.id;
          nuevoCliente.nro_cliente = dbCreated.nro_cliente || nroCliente;
        }
      } catch (insertErr) {
        console.warn('[Backend Clientes] Fallback a memoria local al insertar:', insertErr);
      }
    }

    // Guardar en memoria local
    localClientsSeed.unshift(nuevoCliente);

    // Respuesta exitosa
    res.status(201).json({
      success: true,
      message: 'Cliente registrado correctamente',
      cliente: nuevoCliente
    });
  } catch (error: any) {
    console.error('[Backend Clientes] Error interno:', error);
    res.status(500).json({
      error: 'Error interno al registrar el cliente',
      details: error.message
    });
  }
};

/**
 * Listar clientes
 */
export const listarClientes = async (req: Request, res: Response): Promise<void> => {
  try {
    if (isSupabaseConnected && supabase) {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('fecha_alta', { ascending: false });

      if (data && !error) {
        res.json({ success: true, clientes: data });
        return;
      }
    }

    res.json({ success: true, clientes: localClientsSeed });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al obtener clientes', details: error.message });
  }
};

/**
 * Verificar existencia de tipo y número de documento
 */
export const verificarDocumento = async (req: Request, res: Response): Promise<void> => {
  const tipo = (req.query.tipo || '').toString().trim().toUpperCase();
  const numero = (req.query.numero || '').toString().trim();

  if (!tipo || !numero) {
    res.status(400).json({ error: 'Parámetros tipo y numero requeridos' });
    return;
  }

  const exists = localClientsSeed.some(c => 
    c.tipo_documento.toUpperCase() === tipo && c.nro_documento === numero
  );

  res.json({ existe: exists });
};

/**
 * Endpoint de limpieza para tests BDD (idempotencia)
 */
export const eliminarClienteTest = async (req: Request, res: Response): Promise<void> => {
  const tipo = (req.body?.tipo || req.query?.tipo || '').toString().trim().toUpperCase();
  const numero = (req.body?.numero || req.query?.numero || '').toString().trim();

  const idx = localClientsSeed.findIndex(c => 
    c.tipo_documento.toUpperCase() === tipo && c.nro_documento === numero
  );
  if (idx !== -1) {
    localClientsSeed.splice(idx, 1);
  }

  if (isSupabaseConnected && supabase && numero) {
    try {
      await supabase.from('clientes').delete().eq('nro_documento', numero);
    } catch {
      // ignore
    }
  }

  res.json({ success: true, removed: idx !== -1 });
};


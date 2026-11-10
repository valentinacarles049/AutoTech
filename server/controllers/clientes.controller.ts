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
    const nuevoId = `cli-${Date.now()}-${nroCliente}`;
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
 * HU-05: Buscar Cliente
 * Permite buscar un cliente por documento, apellido o número de cliente.
 * 
 * Criterios de Aceptación:
 * 1. La búsqueda por documento devuelve un único cliente
 * 2. La búsqueda por apellido lista las coincidencias
 * 3. Si no hay resultados se muestra "No se encontraron clientes"
 */
export const buscarClientes = async (req: Request, res: Response): Promise<void> => {
  try {
    const q = (req.query.q || '').toString().trim();
    const filtro = (req.query.filtro || req.query.criterio || 'todos').toString().trim().toLowerCase();
    const paramDoc = (req.query.documento || '').toString().trim();
    const paramApellido = (req.query.apellido || '').toString().trim();
    const paramNroCliente = (req.query.nro_cliente || req.query.numero_cliente || '').toString().trim();

    // Obtener clientes de base de datos o fallback en memoria
    let allClients: LocalClient[] = localClientsSeed;
    if (isSupabaseConnected && supabase) {
      const { data, error } = await supabase.from('clientes').select('*');
      if (data && !error && data.length > 0) {
        allClients = data;
      }
    }

    // 1. Criterio 1: La búsqueda por documento devuelve un único cliente
    if (paramDoc || filtro === 'documento') {
      const docQuery = (paramDoc || q).toLowerCase().replace(/[\s-]/g, '');
      const found = allClients.find(c => {
        const cDoc = (c.nro_documento || '').toLowerCase().replace(/[\s-]/g, '');
        return cDoc === docQuery || c.nro_documento.toLowerCase() === (paramDoc || q).toLowerCase();
      });

      if (!found) {
        // Criterio 3: Si no hay resultados se muestra "No se encontraron clientes"
        res.status(200).json({
          success: true,
          count: 0,
          clientes: [],
          message: 'No se encontraron clientes'
        });
        return;
      }

      res.status(200).json({
        success: true,
        count: 1,
        clientes: [found]
      });
      return;
    }

    // 2. Criterio 2: La búsqueda por apellido lista las coincidencias
    if (paramApellido || filtro === 'apellido') {
      const apeQuery = (paramApellido || q).toLowerCase();
      const matches = allClients.filter(c => 
        (c.apellido && c.apellido.toLowerCase().includes(apeQuery)) ||
        (c.nombre && c.nombre.toLowerCase().includes(apeQuery))
      );

      if (matches.length === 0) {
        // Criterio 3: Si no hay resultados se muestra "No se encontraron clientes"
        res.status(200).json({
          success: true,
          count: 0,
          clientes: [],
          message: 'No se encontraron clientes'
        });
        return;
      }

      res.status(200).json({
        success: true,
        count: matches.length,
        clientes: matches
      });
      return;
    }

    // 3. Búsqueda por número de cliente
    if (paramNroCliente || filtro === 'nro_cliente') {
      const nroQuery = (paramNroCliente || q).replace('#', '').trim();
      const matches = allClients.filter(c => c.nro_cliente?.toString() === nroQuery);

      if (matches.length === 0) {
        res.status(200).json({
          success: true,
          count: 0,
          clientes: [],
          message: 'No se encontraron clientes'
        });
        return;
      }

      res.status(200).json({
        success: true,
        count: matches.length,
        clientes: matches
      });
      return;
    }

    // 4. Búsqueda unificada (parámetro 'q' general)
    if (q) {
      const cleanQ = q.toLowerCase();
      const cleanQDigits = cleanQ.replace(/[\s-]/g, '');

      // A) Coincidencia de documento -> Criterio 1: devuelve un único cliente
      const docMatch = allClients.find(c => {
        const cDoc = (c.nro_documento || '').toLowerCase().replace(/[\s-]/g, '');
        return cDoc === cleanQDigits || c.nro_documento.toLowerCase() === cleanQ;
      });

      if (docMatch && cleanQDigits.length >= 6) {
        res.status(200).json({
          success: true,
          count: 1,
          clientes: [docMatch]
        });
        return;
      }

      // B) Coincidencia de apellido -> Criterio 2: lista las coincidencias
      const apellidoMatches = allClients.filter(c => 
        c.apellido && c.apellido.toLowerCase().includes(cleanQ)
      );

      if (apellidoMatches.length > 0) {
        res.status(200).json({
          success: true,
          count: apellidoMatches.length,
          clientes: apellidoMatches
        });
        return;
      }

      // C) Coincidencia de número de cliente
      const nroMatches = allClients.filter(c => 
        c.nro_cliente?.toString() === cleanQ.replace('#', '')
      );

      if (nroMatches.length > 0) {
        res.status(200).json({
          success: true,
          count: nroMatches.length,
          clientes: nroMatches
        });
        return;
      }

      // D) Búsqueda amplia por nombre, razón social o documento parcial
      const generalMatches = allClients.filter(c => 
        (c.nombre && c.nombre.toLowerCase().includes(cleanQ)) ||
        (c.razon_social && c.razon_social.toLowerCase().includes(cleanQ)) ||
        (c.nro_documento && c.nro_documento.toLowerCase().includes(cleanQ))
      );

      if (generalMatches.length === 0) {
        // Criterio 3: Si no hay resultados se muestra "No se encontraron clientes"
        res.status(200).json({
          success: true,
          count: 0,
          clientes: [],
          message: 'No se encontraron clientes'
        });
        return;
      }

      res.status(200).json({
        success: true,
        count: generalMatches.length,
        clientes: generalMatches
      });
      return;
    }

    // Sin filtro de búsqueda -> retorna todos
    res.status(200).json({
      success: true,
      count: allClients.length,
      clientes: allClients
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Error interno en la búsqueda de clientes',
      details: error.message
    });
  }
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

/**
 * HU-06: Modificar Cliente
 * 
 * Criterios de Aceptación:
 * 1. No se puede modificar el tipo y número de documento a uno ya existente
 * 2. Se validan los mismos campos obligatorios que en el alta:
 *    - nombre, apellido, tipo y número de documento, mail y teléfono
 *    - El mail debe tener formato válido
 * 3. Mensaje de confirmación: "Cliente modificado correctamente"
 */
export const modificarCliente = async (req: Request, res: Response): Promise<void> => {
  try {
    const targetParam = (req.params.id || req.params.nroDocumento || req.body.id || '').toString().trim();
    const originalDoc = (req.body.nro_documento_original || req.body.documento_original || req.query.documento_original || req.query.documento || '').toString().trim();

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

    // Criterio 2: Se validan los mismos campos obligatorios que en el alta
    if (!valNombre || !valApellido || !valTipoDoc || !valNroDoc || !valEmail || !valTelefono) {
      res.status(400).json({
        error: 'Los campos nombre, apellido, tipo y número de documento, mail y teléfono son obligatorios'
      });
      return;
    }

    // Criterio 2: El mail debe tener formato válido
    if (!EMAIL_REGEX.test(valEmail)) {
      res.status(400).json({
        error: 'El mail debe tener formato válido'
      });
      return;
    }

    // Encontrar cliente objetivo en memoria local
    let clientIndex = -1;
    if (targetParam) {
      clientIndex = localClientsSeed.findIndex(c => 
        c.id === targetParam || 
        String(c.nro_cliente) === targetParam ||
        c.nro_documento === targetParam
      );
    }
    if (clientIndex === -1 && originalDoc) {
      clientIndex = localClientsSeed.findIndex(c => c.nro_documento === originalDoc);
    }
    if (clientIndex === -1 && valNroDoc) {
      clientIndex = localClientsSeed.findIndex(c => c.nro_documento === valNroDoc);
    }

    let currentClient = clientIndex !== -1 ? localClientsSeed[clientIndex] : null;

    // Buscar en Supabase si no está en memoria local
    let dbClient: any = null;
    if (!currentClient && isSupabaseConnected && supabase) {
      try {
        const query = supabase.from('clientes').select('*');
        if (targetParam) {
          query.or(`id.eq.${targetParam},nro_documento.eq.${targetParam}`);
        } else if (originalDoc) {
          query.eq('nro_documento', originalDoc);
        } else if (valNroDoc) {
          query.eq('nro_documento', valNroDoc);
        }
        const { data } = await query.maybeSingle();
        if (data) {
          dbClient = data;
        }
      } catch (err) {
        console.warn('[Backend Clientes] Error buscando cliente en Supabase:', err);
      }
    }

    if (!currentClient && !dbClient) {
      res.status(404).json({ error: 'Cliente no encontrado' });
      return;
    }

    const currentId = currentClient?.id || dbClient?.id;

    // Criterio 1: No se puede modificar el tipo y número de documento a uno ya existente
    const duplicateLocal = localClientsSeed.find(c => 
      c.id !== currentId &&
      c.tipo_documento.toUpperCase() === valTipoDoc &&
      c.nro_documento === valNroDoc
    );

    if (duplicateLocal) {
      res.status(409).json({
        error: 'Ya existe un cliente con ese tipo y número de documento'
      });
      return;
    }

    if (isSupabaseConnected && supabase) {
      try {
        const { data: duplicateDb } = await supabase
          .from('clientes')
          .select('id, tipo_documento, nro_documento')
          .ilike('tipo_documento', valTipoDoc)
          .eq('nro_documento', valNroDoc)
          .neq('id', currentId)
          .maybeSingle();

        if (duplicateDb) {
          res.status(409).json({
            error: 'Ya existe un cliente con ese tipo y número de documento'
          });
          return;
        }
      } catch (err) {
        console.warn('[Backend Clientes] Error comprobando duplicados en Supabase:', err);
      }
    }

    // Actualizar en memoria local
    if (clientIndex !== -1) {
      localClientsSeed[clientIndex] = {
        ...localClientsSeed[clientIndex],
        nombre: valNombre,
        apellido: valApellido,
        tipo_documento: valTipoDoc as 'DNI' | 'CUIT' | 'Pasaporte',
        nro_documento: valNroDoc,
        email: valEmail,
        telefono: valTelefono,
        razon_social: valRazonSocial || null,
        localidad: valLocalidad || null
      };
      currentClient = localClientsSeed[clientIndex];
    } else {
      currentClient = {
        id: currentId,
        nro_cliente: dbClient?.nro_cliente || getNextClientNumber(),
        nombre: valNombre,
        apellido: valApellido,
        tipo_documento: valTipoDoc as 'DNI' | 'CUIT' | 'Pasaporte',
        nro_documento: valNroDoc,
        email: valEmail,
        telefono: valTelefono,
        razon_social: valRazonSocial || null,
        localidad: valLocalidad || null,
        nivel_fidelizacion: dbClient?.nivel_fidelizacion || null,
        fecha_alta: dbClient?.fecha_alta || new Date().toISOString().split('T')[0],
        estado: 'Activo'
      };
      localClientsSeed.push(currentClient);
    }

    // Actualizar en Supabase
    if (isSupabaseConnected && supabase) {
      try {
        await supabase
          .from('clientes')
          .update({
            nombre: valNombre,
            apellido: valApellido,
            tipo_documento: valTipoDoc,
            nro_documento: valNroDoc,
            razon_social: valRazonSocial || null,
            email: valEmail,
            telefono: valTelefono,
            localidad: valLocalidad || null
          })
          .eq('id', currentId);
      } catch (err) {
        console.warn('[Backend Clientes] Error actualizando en Supabase:', err);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Cliente modificado correctamente',
      cliente: currentClient
    });
  } catch (error: any) {
    console.error('[Backend Clientes] Error al modificar cliente:', error);
    res.status(500).json({
      error: 'Error interno al modificar el cliente',
      details: error.message
    });
  }
};

/**
 * Restaurar cliente para idempotencia de pruebas
 */
export const restaurarClienteTest = async (req: Request, res: Response): Promise<void> => {
  const { nro_documento, email, telefono, nombre, apellido, tipo_documento } = req.body;
  const targetDoc = nro_documento || '30123456';

  const client = localClientsSeed.find(c => c.nro_documento === targetDoc);
  if (client) {
    if (email) client.email = email;
    if (telefono) client.telefono = telefono;
    if (nombre) client.nombre = nombre;
    if (apellido) client.apellido = apellido;
    if (tipo_documento) client.tipo_documento = tipo_documento;
  }
  res.json({ success: true, cliente: client });
};




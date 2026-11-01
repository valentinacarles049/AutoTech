import { Request, Response } from 'express';
import { supabase, isSupabaseConnected, localVehiclesSeed, LocalVehicle, localClientsSeed } from '../db';

/**
 * HU-06: Registrar Vehículo de Cliente
 * 
 * Criterios de Aceptación:
 * 1. Campos obligatorios: patente, marca, modelo y año
 * 2. La patente es única en el sistema
 * 3. El vehículo queda asociado al cliente seleccionado
 */
export const registrarVehiculo = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      patente,
      dominio,
      marca,
      modelo,
      año,
      anio,
      cliente_id,
      clientId,
      kilometraje_actual,
      mileage,
      estado
    } = req.body;

    const valPatente = String(patente || dominio || '').trim().toUpperCase();
    const valMarca = String(marca || '').trim();
    const valModelo = String(modelo || '').trim();
    const parsedAnio = Number(año ?? anio);
    const valClienteId = String(cliente_id || clientId || '').trim();
    const valKilometraje = Number(kilometraje_actual ?? mileage ?? 0);
    const valEstado = String(estado || 'Activo').trim();

    // 1. Criterio 1: Campos obligatorios: patente, marca, modelo y año
    if (!valPatente || !valMarca || !valModelo || !parsedAnio) {
      res.status(400).json({
        error: 'Los campos patente, marca, modelo y año son obligatorios'
      });
      return;
    }

    const currentYear = new Date().getFullYear();
    if (isNaN(parsedAnio) || parsedAnio < 1920 || parsedAnio > currentYear + 1) {
      res.status(400).json({
        error: `El año del vehículo debe estar entre 1920 y ${currentYear + 1}`
      });
      return;
    }

    // Validación de asociación con cliente (Criterio 3)
    if (!valClienteId) {
      res.status(400).json({
        error: 'Debe especificarse el cliente al que se asociará el vehículo'
      });
      return;
    }

    // 2. Criterio 2: La patente es única en el sistema
    // A) Verificar en Supabase (si está conectado)
    if (isSupabaseConnected && supabase) {
      try {
        const { data: existingDb } = await supabase
          .from('vehiculos')
          .select('dominio')
          .eq('dominio', valPatente)
          .maybeSingle();

        if (existingDb) {
          res.status(409).json({
            error: 'Ya existe un vehículo con esa patente en el sistema'
          });
          return;
        }
      } catch (err) {
        console.warn('[Backend Vehículos] Error comprobando patente en Supabase:', err);
      }
    }

    // B) Verificar en memoria local
    const existingLocal = localVehiclesSeed.find(
      v => v.dominio.toUpperCase() === valPatente
    );

    if (existingLocal) {
      res.status(409).json({
        error: 'Ya existe un vehículo con esa patente en el sistema'
      });
      return;
    }

    // 3. Criterio 3: El vehículo queda asociado al cliente seleccionado
    const nuevoVehiculo: LocalVehicle = {
      dominio: valPatente,
      cliente_id: valClienteId,
      marca: valMarca,
      modelo: valModelo,
      anio: parsedAnio,
      kilometraje_actual: isNaN(valKilometraje) || valKilometraje < 0 ? 0 : valKilometraje,
      estado: valEstado
    };

    // Intentar persistir en Supabase
    if (isSupabaseConnected && supabase) {
      try {
        await supabase
          .from('vehiculos')
          .insert([{
            dominio: valPatente,
            cliente_id: valClienteId,
            marca: valMarca,
            modelo: valModelo,
            anio: parsedAnio,
            kilometraje_actual: nuevoVehiculo.kilometraje_actual,
            estado: valEstado
          }]);
      } catch (insertErr) {
        console.warn('[Backend Vehículos] Fallback a memoria local al insertar:', insertErr);
      }
    }

    // Guardar en semilla local
    localVehiclesSeed.unshift(nuevoVehiculo);

    res.status(201).json({
      success: true,
      message: 'Vehículo registrado correctamente',
      vehiculo: nuevoVehiculo
    });
  } catch (error: any) {
    console.error('[Backend Vehículos] Error interno:', error);
    res.status(500).json({
      error: 'Error interno al registrar el vehículo',
      details: error.message
    });
  }
};

/**
 * Listar vehículos con filtro opcional por cliente
 */
export const listarVehiculos = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cliente_id, clientId } = req.query;
    const targetClienteId = String(cliente_id || clientId || '').trim();

    if (isSupabaseConnected && supabase) {
      try {
        let query = supabase.from('vehiculos').select('*');
        if (targetClienteId) {
          query = query.eq('cliente_id', targetClienteId);
        }
        const { data, error } = await query;
        if (!error && data) {
          res.status(200).json({
            count: data.length,
            vehiculos: data
          });
          return;
        }
      } catch (err) {
        console.warn('[Backend Vehículos] Fallback a memoria local al listar:', err);
      }
    }

    let results = localVehiclesSeed;
    if (targetClienteId) {
      results = results.filter(v => v.cliente_id === targetClienteId);
    }

    res.status(200).json({
      count: results.length,
      vehiculos: results
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Error al obtener vehículos',
      details: error.message
    });
  }
};

/**
 * Verificar si una patente ya existe
 */
export const verificarPatente = async (req: Request, res: Response): Promise<void> => {
  try {
    const { patente, dominio } = req.query;
    const cleanPatente = String(patente || dominio || '').trim().toUpperCase();

    if (!cleanPatente) {
      res.status(400).json({ error: 'La patente es obligatoria para verificar' });
      return;
    }

    // Verificar en Supabase
    if (isSupabaseConnected && supabase) {
      try {
        const { data } = await supabase
          .from('vehiculos')
          .select('dominio')
          .eq('dominio', cleanPatente)
          .maybeSingle();

        if (data) {
          res.status(200).json({ exists: true, patente: cleanPatente });
          return;
        }
      } catch (err) {
        console.warn('[Backend Vehículos] Fallback comprobando patente:', err);
      }
    }

    // Verificar en memoria local
    const exists = localVehiclesSeed.some(v => v.dominio.toUpperCase() === cleanPatente);
    res.status(200).json({ exists, patente: cleanPatente });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al verificar patente', details: error.message });
  }
};

/**
 * Limpieza de datos de prueba para asegurar idempotencia en tests BDD
 */
export const testCleanupVehiculos = async (req: Request, res: Response): Promise<void> => {
  try {
    const { patentes } = req.body;
    const targetPatentes: string[] = Array.isArray(patentes) 
      ? patentes.map((p: string) => String(p).trim().toUpperCase())
      : ['AG-111-ZZ', 'TEST-001', 'TEST-DUP-01', 'XYZ-999-TT'];

    // Limpiar de Supabase si está conectado
    if (isSupabaseConnected && supabase) {
      try {
        await supabase
          .from('vehiculos')
          .delete()
          .in('dominio', targetPatentes);
      } catch (err) {
        console.warn('[Backend Vehículos] Error en cleanup Supabase:', err);
      }
    }

    // Limpiar de memoria local
    const initialLen = localVehiclesSeed.length;
    for (let i = localVehiclesSeed.length - 1; i >= 0; i--) {
      if (targetPatentes.includes(localVehiclesSeed[i].dominio.toUpperCase())) {
        localVehiclesSeed.splice(i, 1);
      }
    }

    res.status(200).json({
      success: true,
      cleaned: initialLen - localVehiclesSeed.length
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Error en cleanup', details: error.message });
  }
};

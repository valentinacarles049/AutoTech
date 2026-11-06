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

/**
 * HU-08: Modificar Vehículo
 * 
 * Criterios de Aceptación:
 * 1. La patente modificada no puede repetirse
 * 2. El kilometraje no puede ser menor al registrado
 * 3. Mensaje de confirmación: "Vehículo modificado correctamente"
 */
export const modificarVehiculo = async (req: Request, res: Response): Promise<void> => {
  try {
    const origPatente = String(req.params.patente || req.body.patente_original || req.body.dominio_original || req.body.patente || req.body.dominio || '').trim().toUpperCase();

    const {
      patente,
      dominio,
      kilometraje,
      kilometraje_actual,
      mileage,
      marca,
      modelo,
      año,
      anio,
      estado
    } = req.body;

    if (!origPatente) {
      res.status(400).json({ error: 'La patente original del vehículo es requerida' });
      return;
    }

    // 1. Buscar vehículo en memoria local
    let vehiculoIndex = localVehiclesSeed.findIndex(
      v => v.dominio.toUpperCase() === origPatente
    );

    let dbVehiculo: any = null;
    if (vehiculoIndex === -1 && isSupabaseConnected && supabase) {
      try {
        const { data } = await supabase
          .from('vehiculos')
          .select('*')
          .eq('dominio', origPatente)
          .maybeSingle();
        if (data) dbVehiculo = data;
      } catch (err) {
        console.warn('[Backend Vehículos] Error buscando vehículo en Supabase:', err);
      }
    }

    if (vehiculoIndex === -1 && !dbVehiculo) {
      res.status(404).json({ error: 'Vehículo no encontrado' });
      return;
    }

    const currentVehiculo = vehiculoIndex !== -1 ? localVehiclesSeed[vehiculoIndex] : dbVehiculo;
    const currentKm = Number(currentVehiculo.kilometraje_actual ?? currentVehiculo.mileage ?? 0);

    // 2. Criterio 2: El kilometraje no puede ser menor al registrado
    const rawKm = kilometraje ?? kilometraje_actual ?? mileage;
    if (rawKm !== undefined) {
      const parsedKm = Number(rawKm);
      if (isNaN(parsedKm) || parsedKm < 0) {
        res.status(400).json({ error: 'El kilometraje ingresado es inválido' });
        return;
      }
      if (parsedKm < currentKm) {
        res.status(400).json({
          error: 'El kilometraje no puede ser menor al registrado'
        });
        return;
      }
    }

    // 3. Criterio 1: La patente modificada no puede repetirse
    const targetPatente = String(patente || dominio || origPatente).trim().toUpperCase();
    if (targetPatente && targetPatente !== origPatente) {
      const dupLocal = localVehiclesSeed.find(
        v => v.dominio.toUpperCase() === targetPatente && v.dominio.toUpperCase() !== origPatente
      );
      if (dupLocal) {
        res.status(409).json({
          error: 'Ya existe un vehículo con esa patente en el sistema'
        });
        return;
      }

      if (isSupabaseConnected && supabase) {
        try {
          const { data: dupDb } = await supabase
            .from('vehiculos')
            .select('dominio')
            .eq('dominio', targetPatente)
            .maybeSingle();

          if (dupDb) {
            res.status(409).json({
              error: 'Ya existe un vehículo con esa patente en el sistema'
            });
            return;
          }
        } catch (err) {
          console.warn('[Backend Vehículos] Error comprobando duplicados en Supabase:', err);
        }
      }
    }

    // Actualizar campos
    const updatedKm = rawKm !== undefined ? Number(rawKm) : currentKm;
    const updatedPatente = targetPatente || origPatente;
    const updatedMarca = marca ? String(marca).trim() : currentVehiculo.marca;
    const updatedModelo = modelo ? String(modelo).trim() : currentVehiculo.modelo;
    const updatedAnio = año || anio ? Number(año || anio) : currentVehiculo.anio;
    const updatedEstado = estado ? String(estado).trim() : currentVehiculo.estado;

    if (vehiculoIndex !== -1) {
      const targetV = localVehiclesSeed[vehiculoIndex];
      targetV.dominio = updatedPatente;
      targetV.kilometraje_actual = updatedKm;
      targetV.marca = updatedMarca;
      targetV.modelo = updatedModelo;
      targetV.anio = updatedAnio;
      targetV.estado = updatedEstado;
    }

    // Actualizar en Supabase
    if (isSupabaseConnected && supabase) {
      try {
        await supabase
          .from('vehiculos')
          .update({
            dominio: updatedPatente,
            kilometraje_actual: updatedKm,
            marca: updatedMarca,
            modelo: updatedModelo,
            anio: updatedAnio,
            estado: updatedEstado
          })
          .eq('dominio', origPatente);
      } catch (err) {
        console.warn('[Backend Vehículos] Error actualizando vehículo en Supabase:', err);
      }
    }

    const resultVehiculo = vehiculoIndex !== -1 ? localVehiclesSeed[vehiculoIndex] : {
      dominio: updatedPatente,
      cliente_id: currentVehiculo.cliente_id,
      marca: updatedMarca,
      modelo: updatedModelo,
      anio: updatedAnio,
      kilometraje_actual: updatedKm,
      estado: updatedEstado
    };

    res.status(200).json({
      success: true,
      message: 'Vehículo modificado correctamente',
      vehiculo: resultVehiculo
    });
  } catch (error: any) {
    console.error('[Backend Vehículos] Error al modificar vehículo:', error);
    res.status(500).json({
      error: 'Error interno al modificar el vehículo',
      details: error.message
    });
  }
};

/**
 * Restaurar vehículo para pruebas BDD (idempotencia)
 */
export const restaurarVehiculoTest = async (req: Request, res: Response): Promise<void> => {
  const { patente, kilometraje_actual, marca, modelo, anio } = req.body;
  const targetPatente = String(patente || 'AB123CD').trim().toUpperCase();

  const veh = localVehiclesSeed.find(v => v.dominio.toUpperCase() === targetPatente);
  if (veh) {
    if (kilometraje_actual !== undefined) veh.kilometraje_actual = Number(kilometraje_actual);
    if (marca) veh.marca = marca;
    if (modelo) veh.modelo = modelo;
    if (anio) veh.anio = Number(anio);
  }
  res.json({ success: true, vehiculo: veh });
};

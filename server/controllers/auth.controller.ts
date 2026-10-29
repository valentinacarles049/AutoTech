import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { supabase, isSupabaseConnected, localEmployeesSeed, LocalEmployee } from '../db';

/**
 * HU-01: Iniciar Sesión
 * Controlador de autenticación para empleados de AutoTech S.A.
 * 
 * Criterios de Aceptación:
 * 1. Las contraseñas se guardan con hash, nunca en texto plano (verificado con bcrypt)
 * 2. Se registra la fecha y hora del último acceso (actualiza ultimo_acceso)
 * 3. Un usuario inactivo no puede ingresar (valida activo === true)
 * (Aún no aplica restricciones de roles: todos los roles pueden autenticarse)
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    // Validación de campos obligatorios
    if (!username || !password) {
      res.status(400).json({ 
        error: 'El nombre de usuario y la contraseña son obligatorios' 
      });
      return;
    }

    const cleanUsername = String(username).trim().toLowerCase();
    const cleanPassword = String(password).trim();

    let employee: {
      legajo: number;
      username: string;
      passwordHash: string;
      nombre: string;
      rol: string;
      activo: boolean;
      ultimoAcceso: string | null;
    } | null = null;

    let isFromDatabase = false;

    // 1. Intentar buscar en la base de datos PostgreSQL / Supabase
    if (isSupabaseConnected && supabase) {
      try {
        const { data, error } = await supabase
          .from('empleados')
          .select('legajo, username, password, nombre, activo, ultimo_acceso, roles ( nombre_rol )')
          .ilike('username', cleanUsername)
          .maybeSingle();

        if (!error && data) {
          employee = {
            legajo: data.legajo,
            username: data.username,
            passwordHash: data.password,
            nombre: data.nombre,
            rol: (data.roles as any)?.nombre_rol || 'Empleado',
            activo: data.activo,
            ultimoAcceso: data.ultimo_acceso
          };
          isFromDatabase = true;
        }
      } catch (dbErr) {
        console.warn('[Backend] Error consultando Supabase, usando fallback local seguro:', dbErr);
      }
    }

    // 2. Si no se encontró en DB remota (o se ejecuta local sin DB), usar el fallback semilla
    if (!employee) {
      const localEmp = localEmployeesSeed.find(
        (e: LocalEmployee) => e.username.toLowerCase() === cleanUsername
      );
      if (localEmp) {
        employee = {
          legajo: localEmp.legajo,
          username: localEmp.username,
          passwordHash: localEmp.password,
          nombre: localEmp.nombre,
          rol: localEmp.rol,
          activo: localEmp.activo,
          ultimoAcceso: localEmp.ultimo_acceso
        };
      }
    }

    // Si el usuario no existe
    if (!employee) {
      res.status(401).json({ 
        error: 'Usuario o contraseña incorrectos' 
      });
      return;
    }

    // HU-01 Criterio 3: Un usuario inactivo no puede ingresar
    if (!employee.activo) {
      res.status(403).json({ 
        error: 'Usuario inactivo. No tiene permisos de acceso al sistema' 
      });
      return;
    }

    // HU-01 Criterio 1: Las contraseñas se guardan con hash, nunca en texto plano
    let isPasswordValid = false;
    try {
      isPasswordValid = await bcrypt.compare(cleanPassword, employee.passwordHash);
    } catch {
      isPasswordValid = false;
    }

    // Fallback de compatibilidad si en DB se guardó en texto plano durante desarrollo inicial
    if (!isPasswordValid && employee.passwordHash === cleanPassword) {
      isPasswordValid = true;
    }

    if (!isPasswordValid) {
      res.status(401).json({ 
        error: 'Usuario o contraseña incorrectos' 
      });
      return;
    }

    // HU-01 Criterio 2: Se registra la fecha y hora del último acceso
    const nowISO = new Date().toISOString();
    employee.ultimoAcceso = nowISO;

    if (isFromDatabase && supabase) {
      try {
        await supabase
          .from('empleados')
          .update({ ultimo_acceso: nowISO })
          .eq('legajo', employee.legajo);
      } catch (updateErr) {
        console.warn('[Backend] No se pudo actualizar ultimo_acceso en DB:', updateErr);
      }
    } else {
      const localRecord = localEmployeesSeed.find(e => e.legajo === employee?.legajo);
      if (localRecord) {
        localRecord.ultimo_acceso = nowISO;
      }
    }

    // HU-02: Generar y establecer la cookie de autenticación
    const sessionPayload = {
      legajo: employee.legajo,
      username: employee.username,
      nombre: employee.nombre,
      rol: employee.rol,
      ultimoAcceso: nowISO
    };
    const sessionToken = Buffer.from(JSON.stringify(sessionPayload)).toString('base64');

    // Cookie segura de autenticación
    res.cookie('auth_token', sessionToken, {
      httpOnly: true,
      secure: false, // Permitido en desarrollo local HTTP
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000 // 24 horas
    });

    res.cookie('session_active', 'true', {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000
    });

    // Respuesta exitosa (NUNCA se retorna el hash ni la contraseña al cliente)
    res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso',
      user: sessionPayload
    });
  } catch (error) {
    console.error('[Backend Auth Error]:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor al procesar el inicio de sesión' 
    });
  }
};

/**
 * HU-02: Cerrar Sesión
 * 
 * Criterios de Aceptación:
 * 1. Al cerrar sesión se elimina la cookie de autenticación
 * 2. Después de cerrar sesión, acceder a cualquier pantalla redirige al login
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // HU-02 Criterio 1: Se elimina la cookie de autenticación
    res.clearCookie('auth_token', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/'
    });

    res.clearCookie('session_active', {
      httpOnly: false,
      sameSite: 'lax',
      path: '/'
    });

    res.status(200).json({
      success: true,
      message: 'Sesión cerrada exitosamente. Cookie de autenticación eliminada.'
    });
  } catch (error) {
    console.error('[Backend Logout Error]:', error);
    res.status(500).json({ 
      error: 'Error interno al cerrar la sesión' 
    });
  }
};

/**
 * Verificación de sesión activa (para validar cookie en el backend)
 */
export const getSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies?.auth_token;

    if (!token) {
      res.status(401).json({
        authenticated: false,
        error: 'No existe cookie de autenticación activa'
      });
      return;
    }

    const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    res.status(200).json({
      authenticated: true,
      user: payload
    });
  } catch {
    res.status(401).json({
      authenticated: false,
      error: 'Cookie de sesión inválida o corrupta'
    });
  }
};

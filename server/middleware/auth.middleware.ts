import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para verificar que la petición cuenta con una cookie de sesión válida
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.cookies?.auth_token;

  if (!token) {
    res.status(401).json({
      error: 'Acceso denegado: Se requiere iniciar sesión'
    });
    return;
  }

  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    (req as any).user = payload;
    next();
  } catch {
    res.status(401).json({
      error: 'Acceso denegado: Sesión inválida'
    });
  }
};

/**
 * HU-03: Middleware para restringir acceso a rutas de backend según el rol
 * 
 * Si el usuario no tiene uno de los roles permitidos (y no es Administrador del sistema),
 * responde con código HTTP 403 y mensaje "Acceso denegado".
 */
export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;

    if (!user) {
      res.status(401).json({ 
        error: 'Acceso denegado: No autenticado' 
      });
      return;
    }

    // Administrador del sistema tiene acceso irrestricto
    if (user.rol === 'Administrador del sistema') {
      next();
      return;
    }

    // Comprobar si el rol del usuario está entre los permitidos
    const hasRole = allowedRoles.some(
      allowed => user.rol.toLowerCase().includes(allowed.toLowerCase())
    );

    if (!hasRole) {
      res.status(403).json({
        error: 'Acceso denegado',
        message: `El rol '${user.rol}' no tiene permisos para acceder a esta función protegida.`,
        requiredRoles: allowedRoles
      });
      return;
    }

    next();
  };
};

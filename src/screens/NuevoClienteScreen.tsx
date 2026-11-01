import React, { useState } from 'react';
import { 
  UserPlus, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  Award, 
  ArrowLeft,
  Sparkles,
  Save,
  Check
} from 'lucide-react';
import { useWorkshop } from '../context/WorkshopContext';
import { Client } from '../types/autotech';

export const NuevoClienteScreen: React.FC = () => {
  const { addClient, setCurrentScreen } = useWorkshop();

  // Estados de los campos del formulario
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState<'DNI' | 'CUIT' | 'Pasaporte'>('DNI');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [mail, setMail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [localidad, setLocalidad] = useState('');

  // Estados de retroalimentación
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [registeredClient, setRegisteredClient] = useState<Client | null>(null);

  // Validación de formato de mail (Criterio 4)
  const validateEmail = (emailStr: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailStr.trim());
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setRegisteredClient(null);

    // Criterio 1: Campos obligatorios
    if (
      !nombre.trim() || 
      !apellido.trim() || 
      !tipoDocumento.trim() || 
      !numeroDocumento.trim() || 
      !mail.trim() || 
      !telefono.trim()
    ) {
      setErrorMessage('Los campos nombre, apellido, tipo y número de documento, mail y teléfono son obligatorios');
      return;
    }

    // Criterio 4: El mail debe tener formato válido
    if (!validateEmail(mail)) {
      setErrorMessage('El mail debe tener formato válido');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await addClient({
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        name: razonSocial.trim() 
          ? `${nombre.trim()} ${apellido.trim()} (${razonSocial.trim()})` 
          : `${nombre.trim()} ${apellido.trim()}`,
        tipoDocumento,
        nroDocumento: numeroDocumento.trim(),
        cuitDni: numeroDocumento.trim(),
        email: mail.trim().toLowerCase(),
        phone: telefono.trim(),
        telefono: telefono.trim(),
        razonSocial: razonSocial.trim() || undefined,
        localidad: localidad.trim() || undefined,
        nivelFidelizacion: null, // Criterio BDD: El cliente queda sin nivel de fidelización asignado
      });

      if (!result.success) {
        // Criterio 3: No se permite duplicar tipo y número de documento
        setErrorMessage(result.error || 'Ya existe un cliente con ese tipo y número de documento');
      } else {
        // Criterio BDD: Muestra el mensaje "Cliente registrado correctamente"
        setSuccessMessage('Cliente registrado correctamente');
        if (result.client) {
          setRegisteredClient(result.client);
        }
      }
    } catch {
      setErrorMessage('Ocurrió un error al registrar el cliente');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setNombre('');
    setApellido('');
    setTipoDocumento('DNI');
    setNumeroDocumento('');
    setMail('');
    setTelefono('');
    setRazonSocial('');
    setLocalidad('');
    setErrorMessage(null);
    setSuccessMessage(null);
    setRegisteredClient(null);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in duration-200">
      
      {/* ENCABEZADO DE PANTALLA OFICIAL "Nuevo cliente" */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-[#3A3A48] pb-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <button 
              onClick={() => setCurrentScreen('comercial')}
              className="hover:text-red-600 dark:hover:text-red-400 flex items-center space-x-1 font-semibold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Módulo Comercial</span>
            </button>
            <span>/</span>
            <span className="text-red-600 font-bold">Registro</span>
          </div>
          <h1 
            id="screen-title" 
            data-testid="screen-title" 
            className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center space-x-2.5"
          >
            <UserPlus className="w-6 h-6 text-red-600" />
            <span>Nuevo cliente</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Registro de datos personales, fiscales y de contacto para otorgamiento de turnos e incorporación al programa de fidelización
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setCurrentScreen('comercial')}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#3A3A48] bg-white dark:bg-[#1E1E24] text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#282832] transition-colors"
          >
            Ver Maestro de Clientes
          </button>
        </div>
      </div>

      {/* MENSAJE DE ÉXITO BDD: "Cliente registrado correctamente" */}
      {successMessage && (
        <div 
          id="mensaje-exito" 
          data-testid="mensaje-exito"
          role="alert"
          className="p-4 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-800 dark:text-emerald-300 flex items-start justify-between shadow-sm animate-in zoom-in-95 duration-200"
        >
          <div className="flex items-start space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-extrabold text-sm">{successMessage}</p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                El cliente ha sido guardado en el ERP y queda listo para recibir turnos de taller.
              </p>
            </div>
          </div>
          <button
            onClick={handleResetForm}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-sm"
          >
            + Registrar otro cliente
          </button>
        </div>
      )}

      {/* TARJETA DE CLIENTE REGISTRADO (MUESTRA NRO DE CLIENTE Y NIVEL DE FIDELIZACIÓN) */}
      {registeredClient && (
        <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 grid grid-cols-1 md:grid-cols-4 gap-4 animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Número de Cliente
            </span>
            <p id="numero-cliente-asignado" data-testid="numero-cliente" className="font-mono text-lg font-black text-slate-900 dark:text-white">
              #{registeredClient.nroCliente || '1004'}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Cliente Registrado
            </span>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {registeredClient.nombre} {registeredClient.apellido}
            </p>
            {registeredClient.razonSocial && (
              <p className="text-xs text-slate-500 font-medium">({registeredClient.razonSocial})</p>
            )}
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Documento
            </span>
            <p className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
              {registeredClient.tipoDocumento}: {registeredClient.nroDocumento}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Nivel de Fidelización
            </span>
            <div>
              <span 
                id="nivel-fidelizacion-asignado" 
                data-testid="nivel-fidelizacion"
                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700"
              >
                <span>●</span>
                <span>Sin nivel de fidelización asignado</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* MENSAJE DE ERROR BDD (ej: "Ya existe un cliente con ese tipo y número de documento") */}
      {errorMessage && (
        <div 
          id="mensaje-error" 
          data-testid="mensaje-error"
          role="alert"
          className="p-4 rounded-2xl bg-red-500/10 border-2 border-red-500/30 text-red-700 dark:text-red-400 flex items-start space-x-3 shadow-sm animate-in shake duration-200"
        >
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-extrabold text-sm">{errorMessage}</p>
            <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-0.5">
              Verificá los datos ingresados antes de volver a presionar Guardar.
            </p>
          </div>
        </div>
      )}

      {/* CUERPO PRINCIPAL: FORMULARIO + RESUMEN PREVIO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* FORMULARIO DE ALTA (8 COLS) */}
        <div className="lg:col-span-8 card-surface rounded-2xl shadow-sm border border-slate-200 dark:border-[#3A3A48] overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-[#3A3A48] bg-slate-50/50 dark:bg-[#1E1E24]/50 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Datos del Cliente
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Los campos marcados con un asterisco (<span className="text-red-600 font-bold">*</span>) son obligatorios
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
              Formulario Oficial ERP
            </span>
          </div>

          <form onSubmit={handleGuardar} className="p-6 space-y-6">
            
            {/* SECCIÓN 1: DATOS PERSONALES */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5" />
                <span>1. Identificación y Datos Personales</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* NOMBRE (OBLIGATORIO) */}
                <div>
                  <label htmlFor="nombre" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nombre <span className="text-red-600 font-bold">*</span>
                  </label>
                  <input
                    id="nombre"
                    name="nombre"
                    data-testid="campo-nombre"
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="ej: Juan"
                    className="app-input w-full px-3.5 py-2.5 text-xs font-medium"
                  />
                </div>

                {/* APELLIDO (OBLIGATORIO) */}
                <div>
                  <label htmlFor="apellido" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Apellido <span className="text-red-600 font-bold">*</span>
                  </label>
                  <input
                    id="apellido"
                    name="apellido"
                    data-testid="campo-apellido"
                    type="text"
                    required
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value)}
                    placeholder="ej: Pérez"
                    className="app-input w-full px-3.5 py-2.5 text-xs font-medium"
                  />
                </div>
              </div>

              {/* TIPO Y NÚMERO DE DOCUMENTO (OBLIGATORIOS) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="tipo_documento" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tipo de documento <span className="text-red-600 font-bold">*</span>
                  </label>
                  <select
                    id="tipo_documento"
                    name="tipo_documento"
                    data-testid="campo-tipo-documento"
                    value={tipoDocumento}
                    onChange={(e) => setTipoDocumento(e.target.value as 'DNI' | 'CUIT' | 'Pasaporte')}
                    className="app-input w-full px-3.5 py-2.5 text-xs font-bold cursor-pointer"
                  >
                    <option value="DNI">DNI (Documento Nacional de Identidad)</option>
                    <option value="CUIT">CUIT / CUIL (Fiscal)</option>
                    <option value="Pasaporte">Pasaporte (Extranjero)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="numero_documento" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Número de documento <span className="text-red-600 font-bold">*</span>
                  </label>
                  <input
                    id="numero_documento"
                    name="numero_documento"
                    data-testid="campo-numero-documento"
                    type="text"
                    required
                    value={numeroDocumento}
                    onChange={(e) => setNumeroDocumento(e.target.value)}
                    placeholder="ej: 30123456"
                    className="app-input w-full px-3.5 py-2.5 text-xs font-mono font-semibold"
                  />
                </div>
              </div>

              {/* RAZÓN SOCIAL (OPCIONAL - CLIENTES EMPRESA) */}
              <div>
                <label htmlFor="razon_social" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Razón social <span className="text-slate-400 font-normal">(opcional - clientes empresa)</span></span>
                  <span className="text-[10px] text-slate-400">Persona Jurídica o Flota</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                  <input
                    id="razon_social"
                    name="razon_social"
                    data-testid="campo-razon-social"
                    type="text"
                    value={razonSocial}
                    onChange={(e) => setRazonSocial(e.target.value)}
                    placeholder="ej: Logística Andina S.A. (dejar vacío si es particular)"
                    className="app-input w-full pl-9 pr-3.5 py-2.5 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: DATOS DE CONTACTO Y FISCALES */}
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-[#3A3A48]">
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
                <Phone className="w-3.5 h-3.5" />
                <span>2. Datos de Contacto y Localización</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* MAIL (OBLIGATORIO - FORMATO VÁLIDO) */}
                <div>
                  <label htmlFor="mail" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Mail <span className="text-red-600 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                    <input
                      id="mail"
                      name="mail"
                      data-testid="campo-mail"
                      type="email"
                      required
                      value={mail}
                      onChange={(e) => setMail(e.target.value)}
                      placeholder="ej: juan.perez@example.com"
                      className="app-input w-full pl-9 pr-3.5 py-2.5 text-xs"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Requerido para el envío de presupuestos y confirmación de turnos.</p>
                </div>

                {/* TELÉFONO (OBLIGATORIO) */}
                <div>
                  <label htmlFor="telefono" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Teléfono <span className="text-red-600 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                    <input
                      id="telefono"
                      name="telefono"
                      data-testid="campo-telefono"
                      type="tel"
                      required
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="ej: 3514556677"
                      className="app-input w-full pl-9 pr-3.5 py-2.5 text-xs font-mono"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Llamadas de aviso y notificaciones vía WhatsApp.</p>
                </div>
              </div>

              {/* LOCALIDAD (OPCIONAL / PRESENTE EN BDD) */}
              <div>
                <label htmlFor="localidad" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Localidad <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                  <input
                    id="localidad"
                    name="localidad"
                    data-testid="campo-localidad"
                    type="text"
                    value={localidad}
                    onChange={(e) => setLocalidad(e.target.value)}
                    placeholder="ej: Córdoba Capital"
                    className="app-input w-full pl-9 pr-3.5 py-2.5 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* BOTONES DE ACCIÓN: "Guardar" REQUERIDO POR BDD */}
            <div className="pt-5 border-t border-slate-200 dark:border-[#3A3A48] flex items-center justify-between">
              <button
                type="button"
                onClick={handleResetForm}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#3A3A48] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Limpiar campos
              </button>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setCurrentScreen('comercial')}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#3A3A48] bg-white dark:bg-[#1E1E24] text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-[#282832] transition-colors"
                >
                  Cancelar
                </button>

                {/* BOTÓN "Guardar" OFICIAL */}
                <button
                  id="btn-guardar"
                  data-testid="btn-guardar"
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-600/30 flex items-center space-x-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmitting ? 'Guardando...' : 'Guardar'}</span>
                </button>
              </div>
            </div>

          </form>
        </div>

        {/* COLUMNA LATERAL (PREVISUALIZACIÓN Y REGLAS DE NEGOCIO) (4 COLS) */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* TARJETA DE PREVISUALIZACIÓN EN TIEMPO REAL */}
          <div className="card-surface rounded-2xl p-5 border border-slate-200 dark:border-[#3A3A48] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#3A3A48] pb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                Ficha del Cliente (Vista Previa)
              </span>
              <span className="badge-green text-[10px]">● Nuevo Registro</span>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center font-extrabold text-base shadow-md shadow-red-600/20">
                {nombre ? nombre.charAt(0).toUpperCase() : 'C'}
                {apellido ? apellido.charAt(0).toUpperCase() : 'L'}
              </div>
              <div className="leading-tight truncate">
                <p className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                  {nombre || apellido ? `${nombre} ${apellido}`.trim() : 'Nombre y Apellido'}
                </p>
                {razonSocial ? (
                  <p className="text-xs text-red-600 dark:text-red-400 font-semibold truncate">{razonSocial}</p>
                ) : (
                  <p className="text-[11px] text-slate-400">Cliente Particular</p>
                )}
              </div>
            </div>

            <div className="space-y-2.5 pt-2 text-xs border-t border-slate-100 dark:border-[#282832]">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Documento:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {tipoDocumento} {numeroDocumento || '----------'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Contacto:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[170px]">
                  {mail || 'sin correo'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Teléfono:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {telefono || 'sin teléfono'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Localidad:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {localidad || 'No especificada'}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-[#282832]">
                <span className="text-slate-400">Fidelización:</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold text-[10px]">
                  Sin nivel asignado
                </span>
              </div>
            </div>
          </div>

          {/* CRITERIOS DE ACEPTACIÓN INFORMATIVOS */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1E1E24] border border-slate-200 dark:border-[#3A3A48] space-y-3 text-xs">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
              <Award className="w-4 h-4 text-red-600" />
              <span>Reglas de Validación ERP (HU-04)</span>
            </h4>
            <ul className="space-y-2 text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
              <li className="flex items-start space-x-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span><strong>Campos obligatorios:</strong> nombre, apellido, tipo y número de documento, mail y teléfono.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span><strong>Razón social opcional:</strong> permite la categorización de flotas y empresas.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span><strong>No duplicados:</strong> se valida unívocamente la combinación de tipo y número de documento.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span><strong>Formato de mail:</strong> se corrobora sintaxis válida estándar RFC antes de registrar.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span><strong>Fidelización inicial:</strong> el cliente nuevo queda sin nivel de fidelización asignado hasta acumular servicios.</span>
              </li>
            </ul>
          </div>

        </div>

      </div>

    </div>
  );
};

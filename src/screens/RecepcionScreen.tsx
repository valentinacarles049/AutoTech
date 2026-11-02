import React, { useState, useMemo, useEffect } from 'react';
import { 
  AlertTriangle, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  FileCheck, 
  Car, 
  UserCheck, 
  Gauge, 
  Calendar, 
  Clock, 
  Building2, 
  Search, 
  AlertCircle, 
  Check, 
  ListFilter,
  ArrowRight,
  ShieldAlert,
  ClipboardList
} from 'lucide-react';
import { useWorkshop } from '../context/WorkshopContext';
import { Turno, Vehicle, Client } from '../types/autotech';

export const RecepcionScreen: React.FC = () => {
  const { 
    clients, 
    vehicles, 
    budgetServices, 
    addBudgetService, 
    removeBudgetService, 
    updateBudgetService,
    selectedReceptionClient,
    selectedReceptionVehicle,
    selectVehicleForReception,
    mileageEntry,
    setMileageEntry,
    turnos,
    sucursales,
    getAvailableHours,
    registerTurno
  } = useWorkshop();

  // Tab activo dentro del módulo de recepción
  const [activeTab, setActiveTab] = useState<'nuevo-turno' | 'agenda' | 'presupuesto'>('nuevo-turno');

  // Estado del formulario de Registro de Solicitud de Turno (HU-09)
  const [dniSearch, setDniSearch] = useState<string>('');
  const [foundClient, setFoundClient] = useState<Client | null>(null);
  const [clientSearchError, setClientSearchError] = useState<string | null>(null);

  const [selectedPlate, setSelectedPlate] = useState<string>('');
  const [motivoConsulta, setMotivoConsulta] = useState<string>('');
  const [selectedSucursal, setSelectedSucursal] = useState<string>(() => sucursales[0]?.nombre || 'Centro');
  const [selectedFecha, setSelectedFecha] = useState<string>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
  const [selectedHorario, setSelectedHorario] = useState<string>('');

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [createdTurnoData, setCreatedTurnoData] = useState<Turno | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Estados para presupuesto (existente)
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceHours, setNewServiceHours] = useState(1.5);
  const [newServiceRate, setNewServiceRate] = useState(28000);
  const [isAddingService, setIsAddingService] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fecha mínima permitida (Hoy) para prevenir turnos en fechas pasadas (HU-09 CA 3)
  const todayISO = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // Configuración dinámica de la sucursal seleccionada
  const currentSucursal = useMemo(() => {
    return sucursales.find(s => s.nombre.toLowerCase() === selectedSucursal.toLowerCase()) || sucursales[0];
  }, [sucursales, selectedSucursal]);

  // Generación 100% dinámica de todos los horarios de atención de la sucursal elegida
  const allBranchSlots = useMemo(() => {
    if (!currentSucursal) return [];
    const startHour = parseInt(currentSucursal.horarioApertura.split(':')[0], 10);
    const endHour = parseInt(currentSucursal.horarioCierre.split(':')[0], 10);
    const slots: string[] = [];
    for (let h = startHour; h <= endHour; h++) {
      slots.push(`${String(h).padStart(2, '0')}:00`);
    }
    return slots;
  }, [currentSucursal]);

  // Lista de vehículos asociados al cliente encontrado
  const clientVehicles = useMemo(() => {
    if (!foundClient) return [];
    return vehicles.filter(v => v.clientId === foundClient.id || v.clienteId === foundClient.id);
  }, [foundClient, vehicles]);

  // Sincronizar selección de vehículo cuando cambia el cliente
  useEffect(() => {
    if (clientVehicles.length > 0) {
      const matchExact = clientVehicles.find(v => v.plate === selectedPlate || v.dominio === selectedPlate);
      if (!matchExact) {
        setSelectedPlate(clientVehicles[0].plate || clientVehicles[0].dominio || '');
      }
    } else {
      setSelectedPlate('');
    }
  }, [clientVehicles]);

  // Criterio 1: Sólo se ofrecen horarios disponibles de la sucursal elegida
  const availableSlots = useMemo(() => {
    return getAvailableHours(selectedSucursal, selectedFecha);
  }, [getAvailableHours, selectedSucursal, selectedFecha, turnos]);

  // Sincronizar horario seleccionado cuando cambian los horarios disponibles
  useEffect(() => {
    if (availableSlots.length > 0) {
      if (!selectedHorario || !availableSlots.includes(selectedHorario)) {
        setSelectedHorario(availableSlots[0]);
      }
    } else {
      setSelectedHorario('');
    }
  }, [availableSlots, selectedHorario]);

  // Búsqueda de cliente por DNI
  const handleSearchClient = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setClientSearchError(null);
    setFormError(null);

    const clean = dniSearch.replace(/[\s-]/g, '').trim().toLowerCase();
    if (!clean) {
      setClientSearchError('Ingrese el número de DNI o documento para realizar la búsqueda');
      setFoundClient(null);
      return;
    }

    const match = clients.find(c => {
      const docClean = (c.nroDocumento || c.cuitDni || '').replace(/[\s-]/g, '').toLowerCase();
      const nroCli = c.nroCliente?.toString() || '';
      return docClean === clean || docClean.includes(clean) || nroCli === clean;
    });

    if (match) {
      setFoundClient(match);
      setClientSearchError(null);
      const vehs = vehicles.filter(v => v.clientId === match.id || v.clienteId === match.id);
      if (vehs.length > 0) {
        setSelectedPlate(vehs[0].plate || vehs[0].dominio || '');
      } else {
        setSelectedPlate('');
      }
    } else {
      setFoundClient(null);
      setClientSearchError(`No se encontró ningún cliente registrado con el documento "${dniSearch}"`);
    }
  };

  // Cargar datos del escenario BDD Juan Pérez
  const handleLoadTestData = () => {
    setDniSearch('30123456');
    const juan = clients.find(c => c.nroDocumento.replace(/[\s-]/g, '') === '30123456');
    if (juan) {
      setFoundClient(juan);
    }
    setSelectedPlate('AB123CD');
    setMotivoConsulta('Mantenimiento general');
    setSelectedSucursal('Centro');
    setSelectedFecha('2026-11-15');
    setSelectedHorario('09:00');
    setFormError(null);
    setFormSuccess(null);
  };

  // HU-09: Envío del formulario para Registrar Turno
  const handleRegisterTurno = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setCreatedTurnoData(null);

    if (!foundClient) {
      setFormError('Debe buscar y seleccionar un cliente antes de registrar el turno');
      return;
    }

    if (!selectedPlate) {
      setFormError('Debe seleccionar un vehículo asociado al cliente');
      return;
    }

    if (!motivoConsulta.trim()) {
      setFormError('Debe ingresar el motivo de consulta para el turno');
      return;
    }

    // Criterio 3: No se permiten turnos en fechas pasadas
    if (selectedFecha < todayISO) {
      setFormError('No se permiten turnos en fechas pasadas');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await registerTurno({
        clienteDni: foundClient.nroDocumento,
        clienteNombre: foundClient.name,
        vehiculoDominio: selectedPlate,
        motivoConsulta: motivoConsulta.trim(),
        sucursal: selectedSucursal,
        fecha: selectedFecha,
        hora: selectedHorario
      });

      if (!result.success) {
        setFormError(result.error || 'El horario seleccionado no está disponible. Seleccione otro horario');
      } else {
        setFormSuccess(`¡Turno #${result.nroTurno} registrado exitosamente! El turno quedó en estado "Solicitado".`);
        if (result.turno) {
          setCreatedTurnoData(result.turno);
        }
      }
    } catch (err: any) {
      setFormError('Ocurrió un error al procesar el registro del turno');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Acciones de presupuesto
  const activeVehicle = vehicles.find(v => v.plate === selectedReceptionVehicle || selectedReceptionVehicle.includes(v.plate)) || vehicles[0];
  const associatedClient = clients.find(c => c.id === activeVehicle?.clientId) || clients[0];

  const totalLabor = budgetServices.reduce((acc, curr) => acc + curr.subtotal, 0);
  const estimatedParts = 154500;
  const iva = Math.round((totalLabor + estimatedParts) * 0.21);
  const grandTotal = totalLabor + estimatedParts + iva;

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName) return;
    addBudgetService({
      description: newServiceName,
      estimatedHours: Number(newServiceHours),
      hourlyRate: Number(newServiceRate),
    });
    setNewServiceName('');
    setIsAddingService(false);
  };

  const handleEmitBudget = () => {
    setToastMessage('¡Presupuesto emitido y orden de servicio generada exitosamente!');
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="space-y-6">
      
      {/* Toast flotante */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 p-4 rounded-xl bg-emerald-600 text-white shadow-xl flex items-center space-x-3 animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* ALERT BOX AMARILLO DESTACADO (REGLA OPERATIVA) */}
      {/* ============================================================ */}
      <div className="p-4 sm:p-5 rounded-2xl border-2 border-amber-400 bg-amber-500/15 text-amber-900 dark:text-amber-200 flex items-start space-x-3.5 shadow-sm">
        <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xs sm:text-sm font-black tracking-tight flex items-center space-x-2">
            <span>Alerta: El turno requiere confirmación 24hs previas</span>
            <span className="badge-yellow text-[10px] py-0.2">Regla Operativa</span>
          </h3>
          <p className="text-xs text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
            La orden no ingresará a línea de taller hasta la confirmación telefónica o digital del cliente y la reserva de los repuestos en pañol.
          </p>
        </div>
      </div>

      {/* PESTAÑAS DE NAVEGACIÓN DENTRO DE RECEPCIÓN */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-[#3A3A48] pb-3">
        <button
          onClick={() => setActiveTab('nuevo-turno')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
            activeTab === 'nuevo-turno'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>HU-09: Registrar Solicitud de Turno</span>
        </button>

        <button
          onClick={() => setActiveTab('agenda')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
            activeTab === 'agenda'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Agenda de Turnos Registrados ({turnos.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('presupuesto')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
            activeTab === 'presupuesto'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Presupuesto de Taller</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* VISTA 1: HU-09 REGISTRAR SOLICITUD DE TURNO */}
      {/* ============================================================ */}
      {activeTab === 'nuevo-turno' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Mensajes de Alerta y Éxito del formulario */}
          {formError && (
            <div className="p-4 rounded-xl border border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300 flex items-center space-x-3 animate-in shake">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 dark:text-red-400" />
              <div className="text-xs font-bold">
                {formError}
              </div>
            </div>
          )}

          {formSuccess && (
            <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 flex items-start space-x-3 animate-in slide-in-from-top-2">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-black">{formSuccess}</p>
                {createdTurnoData && (
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                    Número de turno: <strong>#{createdTurnoData.nroTurno}</strong> • Vehículo: <strong>{createdTurnoData.vehiculoDominio}</strong> • Sucursal: <strong>{createdTurnoData.sucursal}</strong> • Fecha: <strong>{createdTurnoData.fecha}</strong> a las <strong>{createdTurnoData.hora} hs</strong> • Estado inicial: <span className="badge-yellow text-[10px] px-2 py-0.5">{createdTurnoData.estado}</span>
                  </p>
                )}
                <div className="pt-2 flex items-center space-x-2">
                  <button
                    onClick={() => setActiveTab('agenda')}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center space-x-1"
                  >
                    <span>Ver en Agenda</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => {
                      if (createdTurnoData) {
                        selectVehicleForReception(createdTurnoData.vehiculoDominio);
                      }
                      setActiveTab('presupuesto');
                    }}
                    className="px-3 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-100 rounded-lg text-[11px] font-bold"
                  >
                    Emitir Presupuesto de Reparación
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Formulario Principal de Solicitud de Turno */}
          <form onSubmit={handleRegisterTurno} className="space-y-6">
            
            {/* 1. SECCIÓN BÚSQUEDA Y ASIGNACIÓN DE CLIENTE */}
            <div className="card-surface rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-[#3A3A48]">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" />
                  <span>Paso 1: Búsqueda del Cliente por DNI</span>
                </h2>
                <button
                  type="button"
                  onClick={handleLoadTestData}
                  className="px-2.5 py-1 text-[11px] rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-600 border border-red-600/20 font-bold transition-colors text-left"
                >
                  ⚡ Cargar datos de prueba (Juan Pérez - DNI 30123456)
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-8">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center space-x-1.5">
                    <Search className="w-3.5 h-3.5 text-red-600" />
                    <span>DNI del Cliente <span className="text-red-600">*</span></span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={dniSearch}
                      onChange={(e) => setDniSearch(e.target.value)}
                      placeholder="ej: 30123456"
                      className="app-input w-full px-3 py-2.5 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="md:col-span-4 flex space-x-2">
                  <button
                    type="button"
                    onClick={handleSearchClient}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Buscar cliente</span>
                  </button>
                </div>
              </div>

              {clientSearchError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-400 font-medium">
                  {clientSearchError}
                </div>
              )}

              {/* Ficha del cliente encontrado */}
              {foundClient && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1A1A22] border border-emerald-500/30 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Cliente Titular</span>
                    <span className="text-xs font-black text-slate-900 dark:text-white flex items-center space-x-1 mt-0.5">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{foundClient.name}</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Documento</span>
                    <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 block mt-0.5">
                      {foundClient.tipoDocumento} {foundClient.nroDocumento}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Contacto</span>
                    <span className="text-xs text-slate-600 dark:text-slate-300 block mt-0.5">
                      {foundClient.phone || foundClient.email}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 2. SECCIÓN VEHÍCULO Y MOTIVO DE CONSULTA */}
            <div className="card-surface rounded-2xl p-5 shadow-sm space-y-4">
              <div className="pb-3 border-b border-slate-200 dark:border-[#3A3A48]">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" />
                  <span>Paso 2: Selección del Vehículo y Motivo de Consulta</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Selector de Vehículo */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center space-x-1.5">
                    <Car className="w-3.5 h-3.5 text-red-600" />
                    <span>Vehículo <span className="text-red-600">*</span></span>
                  </label>
                  {clientVehicles.length > 0 ? (
                    <select
                      value={selectedPlate}
                      onChange={(e) => setSelectedPlate(e.target.value)}
                      className="app-input w-full px-3 py-2.5 font-bold cursor-pointer text-xs"
                    >
                      {clientVehicles.map(v => (
                        <option key={v.plate || v.dominio} value={v.plate || v.dominio}>
                          {v.plate || v.dominio} - {v.brandModel || `${v.marca} ${v.modelo}`} ({v.year || v.año})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 font-medium">
                      {foundClient 
                        ? 'El cliente no tiene vehículos asociados registrados en su flota.' 
                        : 'Busque un cliente para ver y seleccionar sus vehículos.'}
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                    Seleccione la unidad para la cual se solicita el turno
                  </p>
                </div>

                {/* Motivo de consulta */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center space-x-1.5">
                    <ClipboardList className="w-3.5 h-3.5 text-slate-500" />
                    <span>Motivo de consulta <span className="text-red-600">*</span></span>
                  </label>
                  <input
                    type="text"
                    required
                    value={motivoConsulta}
                    onChange={(e) => setMotivoConsulta(e.target.value)}
                    placeholder="ej: Mantenimiento general, cambio de aceite y filtros, ruidos en frenos..."
                    className="app-input w-full px-3 py-2.5 text-xs font-medium"
                  />
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                    Detalle breve del síntoma o servicio solicitado por el cliente
                  </p>
                </div>
              </div>
            </div>

            {/* 3. SECCIÓN SUCURSAL, FECHA Y HORARIO */}
            <div className="card-surface rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#3A3A48]">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" />
                  <span>Paso 3: Sucursal, Fecha y Horario de Atención</span>
                </h2>
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                  <span>● {availableSlots.length} horarios disponibles</span>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                {/* 3.1 Sucursal */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center space-x-1.5">
                    <Building2 className="w-3.5 h-3.5 text-red-600" />
                    <span>Sucursal <span className="text-red-600">*</span></span>
                  </label>
                  <select
                    value={selectedSucursal}
                    onChange={(e) => setSelectedSucursal(e.target.value)}
                    className="app-input w-full px-3 py-2.5 font-bold cursor-pointer text-xs"
                  >
                    {sucursales.map(s => (
                      <option key={s.id} value={s.nombre}>
                        Sucursal {s.nombre} ({s.horarioApertura} a {s.horarioCierre})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                    Atención de {currentSucursal?.horarioApertura} a {currentSucursal?.horarioCierre}
                  </p>
                </div>

                {/* 3.2 Fecha (Criterio 3: No se permiten fechas pasadas) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-red-600" />
                      <span>Fecha <span className="text-red-600">*</span></span>
                    </span>
                    <span className="text-[10px] text-slate-400">Sin fechas pasadas</span>
                  </label>
                  <input
                    type="date"
                    required
                    min={todayISO} // Impide selección de fechas pasadas en el control
                    value={selectedFecha}
                    onChange={(e) => setSelectedFecha(e.target.value)}
                    className="app-input w-full px-3 py-2 text-xs font-mono font-bold"
                  />
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                    Solo fechas presentes o futuras ({selectedFecha})
                  </p>
                </div>

                {/* 3.3 Horario (Criterio 1: Sólo se ofrecen horarios disponibles de la sucursal) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-red-600" />
                      <span>Horario Disponible <span className="text-red-600">*</span></span>
                    </span>
                    <span className="badge-green text-[9px] py-0 px-2 font-bold">
                      {availableSlots.length} libres
                    </span>
                  </label>
                  {availableSlots.length > 0 ? (
                    <select
                      value={selectedHorario}
                      onChange={(e) => setSelectedHorario(e.target.value)}
                      className="app-input w-full px-3 py-2.5 font-bold font-mono cursor-pointer text-xs"
                    >
                      {availableSlots.map(hora => (
                        <option key={hora} value={hora}>
                          {hora} hs (Disponible)
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400 font-medium">
                      No hay horarios disponibles para esta sucursal y fecha.
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                    Criterio 1: Se excluyen los horarios ya reservados
                  </p>
                </div>
              </div>

              {/* Grilla visual interactiva de slots de horarios para la sucursal y fecha seleccionada */}
              <div className="pt-3 border-t border-slate-200 dark:border-[#3A3A48]">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-2">
                  Grilla de Disponibilidad Horaria - Sucursal {selectedSucursal} ({selectedFecha}):
                </span>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-10 gap-2">
                  {allBranchSlots.map(slot => {
                    const isAvailable = availableSlots.includes(slot);
                    const isSelected = selectedHorario === slot && isAvailable;

                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => {
                          if (isAvailable) setSelectedHorario(slot);
                        }}
                        className={`py-2 px-1 text-center rounded-xl text-xs font-mono font-bold transition-all border ${
                          isSelected
                            ? 'bg-red-600 text-white border-red-600 shadow-md scale-105'
                            : isAvailable
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-[#3A3A48] opacity-50 cursor-not-allowed line-through'
                        }`}
                        title={isAvailable ? `Seleccionar horario ${slot}` : `Horario ${slot} ocupado`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* BOTÓN PRINCIPAL: REGISTRAR TURNO */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                • El turno quedará registrado en estado <strong>"Solicitado"</strong> y el horario reservado dejará de estar disponible.
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !foundClient || !selectedPlate || availableSlots.length === 0}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-xs font-black shadow-lg shadow-red-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                <Calendar className="w-4 h-4" />
                <span>{isSubmitting ? 'Registrando...' : 'Registrar turno'}</span>
              </button>
            </div>

          </form>

        </div>
      )}

      {/* ============================================================ */}
      {/* VISTA 2: AGENDA DE TURNOS REGISTRADOS */}
      {/* ============================================================ */}
      {activeTab === 'agenda' && (
        <div className="card-surface rounded-2xl p-5 shadow-sm space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-[#3A3A48]">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-red-600" />
              <span>Agenda de Turnos Registrados en Taller</span>
            </h2>
            <span className="text-xs text-slate-500">
              Total registrados: <strong>{turnos.length}</strong>
            </span>
          </div>

          {turnos.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Calendar className="w-6 h-6" />
              </div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Aún no hay turnos registrados en la agenda. Utilice la pestaña "HU-09: Registrar Solicitud de Turno" para crear el primero.
              </p>
              <button
                onClick={() => setActiveTab('nuevo-turno')}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold inline-flex items-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Registrar turno</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-[#1A1A22] text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] border-b border-slate-200 dark:border-[#3A3A48]">
                  <tr>
                    <th className="px-4 py-3">N° Turno</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Vehículo</th>
                    <th className="px-4 py-3">Sucursal</th>
                    <th className="px-4 py-3">Fecha y Hora</th>
                    <th className="px-4 py-3">Motivo de Consulta</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-[#3A3A48]">
                  {turnos.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-[#202028]">
                      <td className="px-4 py-3 font-mono font-black text-red-600">
                        #{t.nroTurno}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {t.clienteNombre || 'Cliente'}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {t.clienteDocumento}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {t.vehiculoDominio}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        Sucursal {t.sucursal}
                      </td>
                      <td className="px-4 py-3 font-mono">
                        <div>{t.fecha}</div>
                        <div className="text-[10px] text-slate-400 font-bold">{t.hora} hs</div>
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300 max-w-xs truncate">
                        {t.motivoConsulta}
                      </td>
                      <td className="px-4 py-3">
                        <span className="badge-yellow text-[10px] px-2 py-0.5 font-bold">
                          {t.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => {
                            selectVehicleForReception(t.vehiculoDominio);
                            setActiveTab('presupuesto');
                          }}
                          className="px-2.5 py-1 bg-red-600/10 hover:bg-red-600/20 text-red-600 rounded-lg text-[10px] font-bold border border-red-600/20 transition-colors"
                        >
                          Generar Presupuesto
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* VISTA 3: PRESUPUESTADOR DE TALLER (EXISTENTE) */}
      {/* ============================================================ */}
      {activeTab === 'presupuesto' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* DATOS DEL CLIENTE Y VEHÍCULO INGRESANTE */}
          <div className="card-surface rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#3A3A48]">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" />
                <span>Datos del Cliente y Vehículo Ingresante</span>
              </h2>
              <span className="text-xs text-slate-400">
                Ficha de Recepción
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              {/* 1. SELECTOR VEHÍCULO */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <Car className="w-3.5 h-3.5 text-red-600" />
                    <span>Vehículo <span className="text-red-600 font-bold">*</span></span>
                  </span>
                </label>
                <select
                  value={activeVehicle.plate}
                  onChange={(e) => selectVehicleForReception(e.target.value)}
                  className="app-input w-full px-3 py-2.5 font-medium cursor-pointer"
                >
                  {vehicles.map(v => (
                    <option key={v.plate} value={v.plate}>
                      {v.plate} - {v.brandModel} ({v.year})
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. CLIENTE ASOCIADO */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Cliente Asociado</span>
                  </span>
                  <span className="badge-green text-[9px] py-0 px-2 font-bold">
                    ✓ Autoseleccionado
                  </span>
                </label>
                <input
                  type="text"
                  readOnly
                  value={`${associatedClient.name} (${associatedClient.cuitDni})`}
                  className="app-input w-full px-3 py-2.5 font-semibold bg-slate-100/80 dark:bg-[#1A1A22] text-slate-800 dark:text-slate-100 border-slate-300 dark:border-[#3A3A48] cursor-default select-all"
                />
              </div>

              {/* 3. KILOMETRAJE */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <Gauge className="w-3.5 h-3.5 text-slate-500" />
                    <span>Kilometraje <span className="text-red-600 font-bold">*</span></span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Último: {activeVehicle.mileage.toLocaleString()} km</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    value={mileageEntry}
                    onChange={(e) => setMileageEntry(Number(e.target.value))}
                    className="app-input w-full px-3 py-2.5 font-mono text-xs font-bold"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold pointer-events-none">
                    km
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* TABLA EDITABLE DE SERVICIOS */}
          <div className="card-surface rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#3A3A48]">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" />
                <span>Servicios y Mano de Obra a Presupuestar</span>
              </h2>
              <button
                onClick={() => setIsAddingService(true)}
                className="px-3 py-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-600 border border-red-600/20 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Agregar Servicio</span>
              </button>
            </div>

            {isAddingService && (
              <form onSubmit={handleAddService} className="p-4 rounded-xl bg-slate-50 dark:bg-[#1E1E24] border border-red-500/30 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end animate-in fade-in">
                <div className="sm:col-span-6">
                  <label className="block text-xs font-bold mb-1">Descripción del Servicio *</label>
                  <input
                    type="text"
                    required
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    placeholder="ej: Cambio de líquido refrigerante y termostato"
                    className="app-input w-full px-3 py-2 text-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold mb-1">Horas Est.</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newServiceHours}
                    onChange={(e) => setNewServiceHours(Number(e.target.value))}
                    className="app-input w-full px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold mb-1">Precio Hora ($)</label>
                  <input
                    type="number"
                    value={newServiceRate}
                    onChange={(e) => setNewServiceRate(Number(e.target.value))}
                    className="app-input w-full px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div className="sm:col-span-2 flex space-x-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold"
                  >
                    Agregar
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingService(false)}
                    className="px-3 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>
              </form>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-[#1A1A22] text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] border-b border-slate-200 dark:border-[#3A3A48]">
                  <tr>
                    <th className="px-4 py-3">Item / Servicio</th>
                    <th className="px-4 py-3 w-32">Horas Est.</th>
                    <th className="px-4 py-3 w-36">Precio Hora</th>
                    <th className="px-4 py-3 w-36 text-right">Subtotal</th>
                    <th className="px-4 py-3 w-20 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-[#3A3A48]">
                  {budgetServices.map((srv) => (
                    <tr key={srv.id} className="hover:bg-slate-50 dark:hover:bg-[#202028]">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                        {srv.description}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          step="0.5"
                          value={srv.estimatedHours}
                          onChange={(e) => updateBudgetService(srv.id, Number(e.target.value), srv.hourlyRate)}
                          className="app-input w-24 px-2 py-1 text-center font-mono"
                        />
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">
                        $ {srv.hourlyRate.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white text-right">
                        $ {srv.subtotal.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => removeBudgetService(srv.id)}
                          className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30"
                        >
                          <Trash2 className="w-4 h-4 mx-auto" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totales */}
            <div className="pt-4 border-t border-slate-200 dark:border-[#3A3A48] flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4">
              <div className="text-xs text-slate-500 space-y-1">
                <p>• Los valores incluyen repuestos oficiales con garantía AutoTech 12 meses.</p>
                <p>• Presupuesto con validez de 7 días corridos desde su emisión.</p>
              </div>

              <div className="w-full sm:w-72 space-y-1.5 text-xs text-right bg-slate-50 dark:bg-[#1E1E24] p-4 rounded-xl border border-slate-200 dark:border-[#3A3A48]">
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Mano de Obra:</span>
                  <span className="font-mono">$ {totalLabor.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Repuestos Est.:</span>
                  <span className="font-mono">$ {estimatedParts.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>IVA (21%):</span>
                  <span className="font-mono">$ {iva.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-base font-black text-slate-900 dark:text-white border-t border-slate-200 dark:border-[#3A3A48] pt-2">
                  <span>Total:</span>
                  <span className="text-red-600 font-mono font-black">$ {grandTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setToastMessage('Borrador guardado localmente.')}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#3A3A48] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200"
              >
                Guardar Borrador
              </button>
              <button
                type="button"
                onClick={handleEmitBudget}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/30 transition-all flex items-center space-x-2"
              >
                <FileCheck className="w-4 h-4" />
                <span>Emitir Presupuesto</span>
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};

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
  ClipboardList,
  Mail,
  MessageSquare,
  Send,
  CheckCheck,
  ArrowUpDown,
  RotateCcw
} from 'lucide-react';
import { useWorkshop } from '../context/WorkshopContext';
import { Turno, Vehicle, Client, DisponibilidadHorariaResult, ConfirmarTurnoResult } from '../types/autotech';

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
    consultarDisponibilidad,
    registerTurno,
    confirmarTurno,
    consultarTurnos
  } = useWorkshop();

  // Tab activo dentro del módulo de recepción (HU-09, HU-10, HU-11, HU-12)
  const [activeTab, setActiveTab] = useState<'nuevo-turno' | 'disponibilidad' | 'confirmar-turno' | 'agenda' | 'presupuesto'>('agenda');

  // Estados para HU-12: Consultar turnos filtrando por estado, rango de fechas y sucursal
  const [filtroEstado, setFiltroEstado] = useState<string>('Todos');
  const [filtroSucursal, setFiltroSucursal] = useState<string>('Centro');
  const [filtroFechaDesde, setFiltroFechaDesde] = useState<string>('2026-11-15');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState<string>('2026-11-16');
  const [ordenarFechaHora, setOrdenarFechaHora] = useState<boolean>(true);
  const [ordenDireccion, setOrdenDireccion] = useState<'asc' | 'desc'>('asc');

  const resultadoConsultaTurnos = useMemo(() => {
    return consultarTurnos({
      estado: filtroEstado,
      sucursal: filtroSucursal,
      fechaDesde: filtroFechaDesde,
      fechaHasta: filtroFechaHasta,
      ordenarPorFechaHora: ordenarFechaHora,
      ordenDireccion
    });
  }, [consultarTurnos, filtroEstado, filtroSucursal, filtroFechaDesde, filtroFechaHasta, ordenarFechaHora, ordenDireccion, turnos]);

  // Estados para HU-10: Consultar disponibilidad horaria
  const [dispSucursal, setDispSucursal] = useState<string>(() => sucursales[0]?.nombre || 'Centro');
  const [dispFecha, setDispFecha] = useState<string>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
  const [dispResult, setDispResult] = useState<DisponibilidadHorariaResult | null>(null);
  const [isLoadingDisp, setIsLoadingDisp] = useState<boolean>(false);

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

  // Estados para HU-11: Confirmar Turno
  const [confirmTurnoId, setConfirmTurnoId] = useState<string>('');
  const [confirmMedio, setConfirmMedio] = useState<'Mail' | 'Mensaje'>('Mail');
  const [confirmFechaHoraActual, setConfirmFechaHoraActual] = useState<string>('13/11/2026 10:00');
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirmSuccess, setConfirmSuccess] = useState<string | null>(null);
  const [confirmResult, setConfirmResult] = useState<ConfirmarTurnoResult | null>(null);
  const [isConfirming, setIsConfirming] = useState<boolean>(false);

  // Sincronizar selección de turno a confirmar
  useEffect(() => {
    if (!confirmTurnoId && turnos.length > 0) {
      const solicitado = turnos.find(t => t.estado === 'Solicitado') || turnos[0];
      setConfirmTurnoId(solicitado.id);
    }
  }, [turnos, confirmTurnoId]);

  const handleConfirmarTurno = async () => {
    setConfirmError(null);
    setConfirmSuccess(null);
    setConfirmResult(null);

    const target = turnos.find(t => t.id === confirmTurnoId) || turnos[0];
    if (!target) {
      setConfirmError('Seleccione un turno para confirmar');
      return;
    }

    setIsConfirming(true);
    try {
      const res = await confirmarTurno({
        turnoId: target.id,
        nroTurno: target.nroTurno,
        vehiculoDominio: target.vehiculoDominio,
        clienteDni: target.clienteDocumento,
        medio: confirmMedio,
        fechaHoraActual: confirmFechaHoraActual
      });

      setConfirmResult(res);
      if (res.success) {
        setConfirmSuccess(res.message || 'Turno confirmado exitosamente');
      } else {
        setConfirmError(res.error || res.message || 'El plazo de confirmación venció');
      }
    } catch (err: any) {
      setConfirmError(err.message || 'Error al procesar la confirmación del turno');
    } finally {
      setIsConfirming(false);
    }
  };

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

  // Consulta reactiva de disponibilidad para la pestaña HU-10
  useEffect(() => {
    let isCurrent = true;
    const fetchDisp = async () => {
      setIsLoadingDisp(true);
      try {
        const res = await consultarDisponibilidad(dispSucursal, dispFecha);
        if (isCurrent) setDispResult(res);
      } catch {
        // ignore
      } finally {
        if (isCurrent) setIsLoadingDisp(false);
      }
    };
    fetchDisp();
    return () => { isCurrent = false; };
  }, [dispSucursal, dispFecha, turnos, consultarDisponibilidad]);

  // Transferir horario libre consultado en HU-10 directamente a la solicitud de turno
  const handleSelectSlotForBooking = (hora: string) => {
    setSelectedSucursal(dispSucursal);
    setSelectedFecha(dispFecha);
    setSelectedHorario(hora);
    setActiveTab('nuevo-turno');
  };

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
          onClick={() => setActiveTab('disponibilidad')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
            activeTab === 'disponibilidad'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>HU-10: Consultar Disponibilidad</span>
        </button>

        <button
          onClick={() => setActiveTab('confirmar-turno')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
            activeTab === 'confirmar-turno'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <CheckCheck className="w-4 h-4" />
          <span>HU-11: Confirmar Turno</span>
        </button>

        <button
          onClick={() => setActiveTab('agenda')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
            activeTab === 'agenda'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <ListFilter className="w-4 h-4" />
          <span>HU-12: Consultar Turnos ({turnos.length})</span>
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
                    <span className={availableSlots.length > 0 ? "badge-green text-[9px] py-0 px-2 font-bold" : "badge-yellow text-[9px] py-0 px-2 font-bold text-amber-600"}>
                      {availableSlots.length > 0 ? `${availableSlots.length} libres` : 'Sin disponibilidad'}
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
                    <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 font-bold flex items-center space-x-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                      <span>Sin disponibilidad para la fecha seleccionada</span>
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
      {/* VISTA 1.1: HU-10 CONSULTAR DISPONIBILIDAD HORARIA */}
      {/* ============================================================ */}
      {activeTab === 'disponibilidad' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Card de Filtros de Consulta */}
          <div className="card-surface rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-[#3A3A48]">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Clock className="w-4 h-4 text-red-600" />
                <span>HU-10: Consultar Disponibilidad Horaria por Sucursal y Fecha</span>
              </h2>
              <span className="text-xs text-slate-500">
                Herramienta para recepcionistas en atención al cliente
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Selector Sucursal */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center space-x-1.5">
                  <Building2 className="w-3.5 h-3.5 text-red-600" />
                  <span>Sucursal <span className="text-red-600">*</span></span>
                </label>
                <select
                  value={dispSucursal}
                  onChange={(e) => setDispSucursal(e.target.value)}
                  className="app-input w-full px-3 py-2.5 font-bold cursor-pointer text-xs"
                >
                  {sucursales.map(s => (
                    <option key={s.id} value={s.nombre}>
                      Sucursal {s.nombre} ({s.horarioApertura} a {s.horarioCierre}) - {s.direccion}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                  Criterio 1: Solo se consideran horarios dentro del horario de atención de la sucursal elegida
                </p>
              </div>

              {/* Selector Fecha */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5 text-red-600" />
                    <span>Fecha a Consultar <span className="text-red-600">*</span></span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Formato YYYY-MM-DD</span>
                </label>
                <input
                  type="date"
                  required
                  min={todayISO}
                  value={dispFecha}
                  onChange={(e) => setDispFecha(e.target.value)}
                  className="app-input w-full px-3 py-2 text-xs font-mono font-bold"
                />
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                  Seleccione el día para verificar los turnos disponibles
                </p>
              </div>
            </div>
          </div>

          {/* Información y Resultados de Disponibilidad */}
          {dispResult && (
            <div className="space-y-4">
              
              {/* Tarjeta de Métricas de la Consulta */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="card-surface rounded-2xl p-4 shadow-sm border-l-4 border-l-blue-600">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Horario de Atención</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white block mt-0.5">
                    {dispResult.horarioAtencion} hs
                  </span>
                  <span className="text-[10px] text-slate-500">Sucursal {dispResult.sucursal}</span>
                </div>

                <div className={`card-surface rounded-2xl p-4 shadow-sm border-l-4 ${dispResult.tieneDisponibilidad ? 'border-l-emerald-600' : 'border-l-amber-500'}`}>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Horarios Libres</span>
                  <span className={`text-sm font-black block mt-0.5 ${dispResult.tieneDisponibilidad ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600'}`}>
                    {dispResult.horariosDisponibles.length} de {dispResult.totalHorarios} slots
                  </span>
                  <span className="text-[10px] text-slate-500">{dispResult.fecha}</span>
                </div>

                <div className="card-surface rounded-2xl p-4 shadow-sm border-l-4 border-l-slate-400">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Horarios Ocupados</span>
                  <span className="text-sm font-black text-slate-700 dark:text-slate-300 block mt-0.5">
                    {dispResult.horariosOcupados.length} reservados
                  </span>
                  <span className="text-[10px] text-slate-500">Solicitados o Confirmados</span>
                </div>
              </div>

              {/* HU-10 CRITERIO 3: Si no hay horarios libres se muestra "Sin disponibilidad para la fecha seleccionada" */}
              {!dispResult.tieneDisponibilidad || dispResult.horariosDisponibles.length === 0 ? (
                <div className="p-6 rounded-2xl border-2 border-amber-400 bg-amber-500/15 text-amber-950 dark:text-amber-200 flex items-start space-x-3.5 shadow-sm animate-in fade-in">
                  <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h3 className="text-sm sm:text-base font-black tracking-tight text-amber-900 dark:text-amber-200">
                      Sin disponibilidad para la fecha seleccionada
                    </h3>
                    <p className="text-xs text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
                      No quedan horarios libres dentro del horario de atención ({dispResult.horarioAtencion}) de la sucursal {dispSucursal} para la fecha {dispResult.fecha}. Todos los horarios han sido reservados con turnos Solicitados o Confirmados.
                    </p>
                  </div>
                </div>
              ) : (
                /* HORARIOS LIBRES DISPONIBLES */
                <div className="card-surface rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#3A3A48]">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                      <span>Horarios Libres para Ofrecer al Cliente ({dispResult.horariosDisponibles.length})</span>
                    </h3>
                    <span className="badge-green text-[10px] py-0.5 px-2 font-bold">
                      Disponibles
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {dispResult.horariosDisponibles.map(hora => (
                      <div
                        key={hora}
                        className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/15 transition-all flex flex-col justify-between space-y-2 group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-sm font-black text-emerald-800 dark:text-emerald-200">
                            {hora} hs
                          </span>
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            Libre
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSelectSlotForBooking(hora)}
                          className="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-colors flex items-center justify-center space-x-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Ofrecer y Reservar</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* HU-10 CRITERIO 2: HORARIOS EXCLUIDOS CON TURNOS SOLICITADOS O CONFIRMADOS */}
              {dispResult.horariosOcupados.length > 0 && (
                <div className="card-surface rounded-2xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#3A3A48]">
                    <h3 className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
                      <span>Horarios Excluidos por Turnos Solicitados o Confirmados ({dispResult.horariosOcupados.length})</span>
                    </h3>
                    <span className="text-[10px] text-slate-400">Criterio 2: Excluidos de los libres</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                    {dispResult.horariosOcupados.map(item => (
                      <div
                        key={item.hora}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-[#3A3A48] bg-slate-50 dark:bg-[#1A1A22] opacity-75 flex items-center justify-between text-xs"
                      >
                        <span className="font-mono font-bold text-slate-500 line-through">
                          {item.hora} hs
                        </span>
                        <span className="badge-yellow text-[9px] py-0 px-1.5 font-bold">
                          {item.estado}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      )}

      {/* ============================================================ */}
      {/* VISTA HU-11: CONFIRMAR TURNO (CLIENTE / MENSAJERÍA) */}
      {/* ============================================================ */}
      {activeTab === 'confirmar-turno' && (
        <div className="card-surface rounded-2xl p-6 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-[#3A3A48]">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <CheckCheck className="w-5 h-5 text-emerald-600" />
                <span>HU-11: Confirmar Turno de Cliente</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Como cliente, quiero confirmar mi turno por mail o mensaje, para asegurar mi lugar en la sucursal.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                Regla: Faltar ≥ 24 hs
              </span>
            </div>
          </div>

          {/* MENSAJES DE ESTADO */}
          {confirmError && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-400 text-xs flex items-start space-x-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
              <div>
                <p className="font-bold text-sm">{confirmError}</p>
                <p className="text-[11px] mt-1 text-red-600/90 dark:text-red-400/90">
                  El turno no puede confirmarse porque faltan menos de 24 hs para el horario programado. El turno permanece en estado "Solicitado".
                </p>
              </div>
            </div>
          )}

          {confirmSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-start space-x-3 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
              <div className="space-y-1">
                <p className="font-bold text-sm">{confirmSuccess}</p>
                <p className="text-[11px]">
                  El turno pasó a estado <strong>"Confirmado"</strong> y se registró la confirmación con fecha, hora y medio.
                </p>
              </div>
            </div>
          )}

          {/* SELECTOR DE TURNO */}
          <div className="space-y-4">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              1. Seleccione el Turno a Confirmar <span className="text-red-600 font-bold">*</span>
            </label>

            {turnos.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1A1A22] border border-slate-200 dark:border-[#3A3A48] text-xs text-slate-500">
                No hay turnos registrados aún. Registre uno en "HU-09: Registrar Solicitud de Turno".
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {turnos.map(t => {
                  const isSelected = t.id === confirmTurnoId;
                  const isConfirmado = t.estado === 'Confirmado';
                  return (
                    <div
                      key={t.id}
                      onClick={() => setConfirmTurnoId(t.id)}
                      className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20 shadow-sm'
                          : 'border-slate-200 dark:border-[#3A3A48] bg-slate-50/50 dark:bg-[#1A1A22]/60 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#2A2A38]">
                        <span className="font-mono font-bold text-red-600">
                          #{t.nroTurno}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isConfirmado
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                        }`}>
                          {t.estado}
                        </span>
                      </div>
                      <div className="mt-2 space-y-1">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {t.clienteNombre || 'Cliente'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Vehículo: <strong className="font-mono text-slate-700 dark:text-slate-300">{t.vehiculoDominio}</strong>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Sucursal: <strong>{t.sucursal}</strong>
                        </div>
                        <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                          {t.fecha} a las {t.hora} hs
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* FORMULARIO DE CONFIRMACIÓN */}
          {confirmTurnoId && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200 dark:border-[#3A3A48]">
              {/* MEDIO DE CONTACTO */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  2. Medio de Confirmación <span className="text-red-600 font-bold">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setConfirmMedio('Mail')}
                    className={`p-3 rounded-xl border flex items-center space-x-2.5 text-xs font-bold transition-all ${
                      confirmMedio === 'Mail'
                        ? 'border-red-600 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 shadow-sm'
                        : 'border-slate-200 dark:border-[#3A3A48] text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <Mail className="w-4 h-4 text-red-600" />
                    <span>Por Mail</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmMedio('Mensaje')}
                    className={`p-3 rounded-xl border flex items-center space-x-2.5 text-xs font-bold transition-all ${
                      confirmMedio === 'Mensaje'
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 shadow-sm'
                        : 'border-slate-200 dark:border-[#3A3A48] text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <span>Por Mensaje (SMS/WA)</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Se registrará el medio seleccionado y se emitirá la notificación al cliente.
                </p>
              </div>

              {/* SIMULACIÓN FECHA / HORA ACTUAL (CRITERIO 24 HS) */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  3. Fecha y Hora Actual (Simulación BDD)
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmFechaHoraActual('13/11/2026 10:00')}
                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 transition-colors"
                  >
                    ✓ 13/11/2026 10:00 (Dentro plazo)
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmFechaHoraActual('14/11/2026 10:00')}
                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-950/50 dark:text-red-300 transition-colors"
                  >
                    ✗ 14/11/2026 10:00 (Fuera plazo)
                  </button>
                </div>
                <input
                  type="text"
                  value={confirmFechaHoraActual}
                  onChange={(e) => setConfirmFechaHoraActual(e.target.value)}
                  placeholder="DD/MM/YYYY HH:mm"
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-[#3A3A48] bg-white dark:bg-[#1A1A22] text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* BOTÓN DE ACCIÓN */}
          <div className="pt-4 border-t border-slate-200 dark:border-[#3A3A48] flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleConfirmarTurno}
              disabled={isConfirming || !confirmTurnoId}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center space-x-2 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>{isConfirming ? 'Confirmando...' : 'Confirmar Turno'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('agenda')}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Ver en Agenda
            </button>
          </div>

          {/* DETALLES DE LA NOTIFICACIÓN EMITIDA */}
          {confirmResult?.success && confirmResult.notificacion && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1A1A22] border border-emerald-200 dark:border-emerald-900/60 space-y-2 animate-in fade-in">
              <div className="flex items-center space-x-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Notificación Enviada al Cliente (Criterio 4)</span>
              </div>
              <div className="text-xs text-slate-700 dark:text-slate-300 font-mono bg-white dark:bg-[#121218] p-3 rounded-lg border border-slate-200 dark:border-[#2A2A38]">
                <div><strong>Destinatario:</strong> {confirmResult.notificacion.destinatario} ({confirmResult.notificacion.medio})</div>
                <div><strong>Fecha del Turno:</strong> {confirmResult.notificacion.fechaTurno}</div>
                <div><strong>Hora del Turno:</strong> {confirmResult.notificacion.horaTurno} hs</div>
                <div className="mt-1 text-slate-500 italic">"{confirmResult.notificacion.mensaje}"</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* VISTA 2: HU-12 CONSULTAR TURNOS POR ESTADO, FECHA Y SUCURSAL */}
      {/* ============================================================ */}
      {activeTab === 'agenda' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Panel de Filtros Combinables y Ordenamiento (HU-12 CA 1 y CA 3) */}
          <div className="card-surface rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-[#3A3A48]">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <ListFilter className="w-4 h-4 text-red-600" />
                  <span>HU-12: Consultar Turnos por Estado, Fecha y Sucursal</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Filtros combinables y ordenamiento cronológico por fecha y hora para organizar la atención del día.
                </p>
              </div>

              {/* Botones rápidos para probar los escenarios BDD */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFiltroEstado('Confirmado');
                    setFiltroFechaDesde('2026-11-15');
                    setFiltroFechaHasta('2026-11-16');
                    setFiltroSucursal('Centro');
                    setOrdenarFechaHora(true);
                    setOrdenDireccion('asc');
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 transition-colors"
                >
                  ⚡ Escenario 1: Confirmados (15/11 al 16/11)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFiltroEstado('Cancelado');
                    setFiltroFechaDesde('2026-11-15');
                    setFiltroFechaHasta('2026-11-16');
                    setFiltroSucursal('Centro');
                    setOrdenarFechaHora(true);
                    setOrdenDireccion('asc');
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 transition-colors"
                >
                  ⚡ Escenario 2: Cancelados (Sin resultados)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFiltroEstado('Todos');
                    setFiltroFechaDesde('');
                    setFiltroFechaHasta('');
                    setFiltroSucursal('Todas');
                    setOrdenarFechaHora(true);
                    setOrdenDireccion('asc');
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center space-x-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Ver todos</span>
                </button>
              </div>
            </div>

            {/* Grilla de controles de filtrado (Criterio 1: estado, rango de fechas y sucursal) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
              {/* 1. Estado */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Estado del Turno
                </label>
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  className="app-input w-full px-3 py-2 text-xs font-bold cursor-pointer"
                >
                  <option value="Todos">Todos los estados</option>
                  <option value="Confirmado">Confirmado</option>
                  <option value="Solicitado">Solicitado</option>
                  <option value="En Taller">En Taller</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
              </div>

              {/* 2. Fecha Desde */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Fecha Desde
                </label>
                <input
                  type="date"
                  value={filtroFechaDesde}
                  onChange={(e) => setFiltroFechaDesde(e.target.value)}
                  className="app-input w-full px-3 py-2 text-xs font-mono font-bold"
                />
              </div>

              {/* 3. Fecha Hasta */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Fecha Hasta
                </label>
                <input
                  type="date"
                  value={filtroFechaHasta}
                  onChange={(e) => setFiltroFechaHasta(e.target.value)}
                  className="app-input w-full px-3 py-2 text-xs font-mono font-bold"
                />
              </div>

              {/* 4. Sucursal */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Sucursal
                </label>
                <select
                  value={filtroSucursal}
                  onChange={(e) => setFiltroSucursal(e.target.value)}
                  className="app-input w-full px-3 py-2 text-xs font-bold cursor-pointer"
                >
                  <option value="Todas">Todas las sucursales</option>
                  {sucursales.map(s => (
                    <option key={s.id} value={s.nombre}>
                      {s.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* 5. Ordenar por Fecha y Hora (Criterio 3) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Ordenar por Fecha y Hora
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (!ordenarFechaHora) {
                      setOrdenarFechaHora(true);
                      setOrdenDireccion('asc');
                    } else {
                      setOrdenDireccion(prev => prev === 'asc' ? 'desc' : 'asc');
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-[#3A3A48] bg-slate-50 dark:bg-[#1A1A22] hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center space-x-1.5">
                    <ArrowUpDown className="w-3.5 h-3.5 text-red-600" />
                    <span>{ordenDireccion === 'asc' ? 'Fecha y Hora (Asc)' : 'Fecha y Hora (Desc)'}</span>
                  </span>
                  <span className="text-[10px] font-mono text-red-600 font-black">
                    {ordenDireccion === 'asc' ? '09:00 → 11:00' : '11:00 → 09:00'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Tabla de Resultados o Mensaje de Sin Coincidencias */}
          <div className="card-surface rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-[#3A3A48]">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-red-600" />
                <span>Listado de Turnos ({resultadoConsultaTurnos.total})</span>
              </h3>
              <span className="text-xs text-slate-500">
                Mostrando <strong>{resultadoConsultaTurnos.total}</strong> de <strong>{turnos.length}</strong> turnos registrados
              </span>
            </div>

            {resultadoConsultaTurnos.total === 0 ? (
              <div className="py-12 px-4 text-center space-y-3 rounded-xl border border-amber-500/30 bg-amber-500/10">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <p className="text-sm font-black text-amber-900 dark:text-amber-200">
                  No se encontraron turnos para los filtros seleccionados
                </p>
                <p className="text-xs text-amber-800/80 dark:text-amber-300/80">
                  Intente modificar el estado, el rango de fechas o la sucursal seleccionada.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-[#1A1A22] text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] border-b border-slate-200 dark:border-[#3A3A48]">
                    <tr>
                      <th className="px-4 py-3">Cliente</th>
                      <th className="px-4 py-3">Patente</th>
                      <th className="px-4 py-3">Motivo de Consulta</th>
                      <th className="px-4 py-3">Sucursal</th>
                      <th 
                        className="px-4 py-3 cursor-pointer hover:text-red-600 select-none"
                        onClick={() => setOrdenDireccion(prev => prev === 'asc' ? 'desc' : 'asc')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Fecha</span>
                          <ArrowUpDown className="w-3 h-3 text-red-600" />
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 cursor-pointer hover:text-red-600 select-none"
                        onClick={() => setOrdenDireccion(prev => prev === 'asc' ? 'desc' : 'asc')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Hora</span>
                          <ArrowUpDown className="w-3 h-3 text-red-600" />
                        </div>
                      </th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-[#3A3A48]">
                    {resultadoConsultaTurnos.turnos.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-[#202028]">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {t.clienteNombre || t.cliente || 'Cliente'}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            Turno #{t.nroTurno} {t.clienteDocumento ? `• DNI ${t.clienteDocumento}` : ''}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono font-bold text-red-600">
                            {t.vehiculoDominio || t.patente}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300 max-w-xs">
                          {t.motivoConsulta || t.motivo}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {t.sucursal}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                          {t.fecha}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {t.hora}
                        </td>
                        <td className="px-4 py-3">
                          {t.estado === 'Confirmado' ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              <span>Confirmado</span>
                            </span>
                          ) : t.estado === 'Cancelado' ? (
                            <span className="badge-gray text-[10px] px-2.5 py-0.5 font-bold">
                              Cancelado
                            </span>
                          ) : (
                            <span className="badge-yellow text-[10px] px-2.5 py-0.5 font-bold">
                              {t.estado}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            {t.estado === 'Solicitado' && (
                              <button
                                onClick={() => {
                                  setConfirmTurnoId(t.id);
                                  setActiveTab('confirmar-turno');
                                }}
                                className="px-2.5 py-1 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-bold border border-emerald-600/20 transition-colors flex items-center space-x-1"
                                title="Confirmar turno (HU-11)"
                              >
                                <CheckCheck className="w-3 h-3" />
                                <span>Confirmar</span>
                              </button>
                            )}
                            <button
                              onClick={() => {
                                selectVehicleForReception(t.vehiculoDominio);
                                setActiveTab('presupuesto');
                              }}
                              className="px-2.5 py-1 bg-red-600/10 hover:bg-red-600/20 text-red-600 rounded-lg text-[10px] font-bold border border-red-600/20 transition-colors"
                            >
                              Presupuesto
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
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

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
  RotateCcw,
  UserX,
  Ban,
  XCircle,
  CalendarClock,
  Edit3,
  History
} from 'lucide-react';
import { useWorkshop } from '../context/WorkshopContext';
import { 
  Turno, 
  CambioEstadoTurno,
  Vehicle, 
  Client, 
  DisponibilidadHorariaResult, 
  ConfirmarTurnoResult, 
  CancelarTurnoResult,
  ModificarTurnoResult,
  FinalizarTurnoResult,
  DetallePresupuesto,
  Presupuesto,
  RegistrarPresupuestoResult
} from '../types/autotech';

const parseDateTimeStr = (dateStr: string, timeStr?: string): Date | null => {
  if (!dateStr) return null;
  const combined = timeStr ? `${dateStr.trim()} ${timeStr.trim()}` : dateStr.trim();
  const slashMatch = combined.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/);
  if (slashMatch) {
    return new Date(
      Number(slashMatch[3]),
      Number(slashMatch[2]) - 1,
      Number(slashMatch[1]),
      slashMatch[4] ? Number(slashMatch[4]) : 0,
      slashMatch[5] ? Number(slashMatch[5]) : 0,
      0
    );
  }
  const isoMatch = combined.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s]+(\d{1,2}):(\d{2}))?$/);
  if (isoMatch) {
    return new Date(
      Number(isoMatch[1]),
      Number(isoMatch[2]) - 1,
      Number(isoMatch[3]),
      isoMatch[4] ? Number(isoMatch[4]) : 0,
      isoMatch[5] ? Number(isoMatch[5]) : 0,
      0
    );
  }
  const dt = new Date(combined);
  return isNaN(dt.getTime()) ? null : dt;
};

const formatDateTimeDisplayLocal = (dt: Date): string => {
  const d = String(dt.getDate()).padStart(2, '0');
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const y = dt.getFullYear();
  const hh = String(dt.getHours()).padStart(2, '0');
  const mm = String(dt.getMinutes()).padStart(2, '0');
  return `${d}/${m}/${y} ${hh}:${mm}`;
};

const computeOffsetDateTime = (fecha: string, hora: string, offsetHours: number): string => {
  const base = parseDateTimeStr(fecha, hora);
  if (!base) return formatDateTimeDisplayLocal(new Date());
  const shifted = new Date(base.getTime() + offsetHours * 60 * 60 * 1000);
  return formatDateTimeDisplayLocal(shifted);
};

const calcHoursRemaining = (fecha: string, hora: string, refStr: string): number | null => {
  const turnoDt = parseDateTimeStr(fecha, hora);
  const refDt = parseDateTimeStr(refStr);
  if (!turnoDt || !refDt) return null;
  return Math.round(((turnoDt.getTime() - refDt.getTime()) / (1000 * 60 * 60)) * 10) / 10;
};

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
    cancelarTurno,
    modificarTurno,
    consultarTurnos,
    finalizarTurno,
    registrarAusenciaTurno,
    presupuestos,
    registrarPresupuesto,
    modificarPresupuesto,
    verificarVencimientoPresupuesto
  } = useWorkshop();

  // Tab activo dentro del módulo de recepción
  const [activeTab, setActiveTab] = useState<'nuevo-turno' | 'disponibilidad' | 'confirmar-turno' | 'agenda' | 'finalizar-turno' | 'presupuesto'>('agenda');

  // Estados para consulta y filtrado de turnos
  const [filtroEstado, setFiltroEstado] = useState<string>('Todos');
  const [filtroSucursal, setFiltroSucursal] = useState<string>('Todas');
  const [filtroFechaDesde, setFiltroFechaDesde] = useState<string>('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState<string>('');
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
  const [confirmFechaHoraActual, setConfirmFechaHoraActual] = useState<string>(() => formatDateTimeDisplayLocal(new Date()));
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirmSuccess, setConfirmSuccess] = useState<string | null>(null);
  const [confirmResult, setConfirmResult] = useState<ConfirmarTurnoResult | null>(null);
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [turnoHistorialModal, setTurnoHistorialModal] = useState<Turno | null>(null);

  // Estados para HU-12: Cancelar Turno
  const [turnoToCancel, setTurnoToCancel] = useState<Turno | null>(null);
  const [motivoCancelacionInput, setMotivoCancelacionInput] = useState<string>('');
  const [cancelModalError, setCancelModalError] = useState<string | null>(null);
  const [cancelModalSuccess, setCancelModalSuccess] = useState<string | null>(null);
  const [isCanceling, setIsCanceling] = useState<boolean>(false);

  const handleCancelarTurno = async () => {
    if (!turnoToCancel) return;
    setCancelModalError(null);
    setCancelModalSuccess(null);

    const rawMotivo = motivoCancelacionInput.trim();
    if (!rawMotivo) {
      setCancelModalError('El motivo de cancelación es obligatorio');
      return;
    }

    setIsCanceling(true);
    try {
      const res = await cancelarTurno({
        turnoId: turnoToCancel.id,
        nroTurno: turnoToCancel.nroTurno,
        patente: turnoToCancel.vehiculoDominio,
        motivo: rawMotivo,
        canceladoPor: 'Responsable de Recepción'
      });

      if (res.success) {
        setCancelModalSuccess(`Turno cancelado exitosamente. El horario ${turnoToCancel.hora} del ${turnoToCancel.fecha} vuelve a estar disponible.`);
        setTimeout(() => {
          setTurnoToCancel(null);
          setMotivoCancelacionInput('');
          setCancelModalSuccess(null);
        }, 1200);
      } else {
        setCancelModalError(res.error || res.message || 'Error al cancelar turno');
      }
    } catch (err: any) {
      setCancelModalError(err.message || 'Error al cancelar turno');
    } finally {
      setIsCanceling(false);
    }
  };

  // Estados para HU-13: Modificar Turno
  const [turnoToModify, setTurnoToModify] = useState<Turno | null>(null);
  const [modNuevaFecha, setModNuevaFecha] = useState<string>('16/11/2026');
  const [modNuevoHorario, setModNuevoHorario] = useState<string>('10:00');
  const [modNuevaSucursal, setModNuevaSucursal] = useState<string>('');
  const [modError, setModError] = useState<string | null>(null);
  const [modSuccess, setModSuccess] = useState<string | null>(null);
  const [isModifying, setIsModifying] = useState<boolean>(false);

  const handleModificarTurno = async () => {
    if (!turnoToModify) return;
    setModError(null);
    setModSuccess(null);

    const f = modNuevaFecha.trim();
    const h = modNuevoHorario.trim();
    if (!f || !h) {
      setModError('La fecha y el horario son obligatorios');
      return;
    }

    setIsModifying(true);
    try {
      const res = await modificarTurno({
        turnoId: turnoToModify.id,
        nroTurno: turnoToModify.nroTurno,
        patente: turnoToModify.vehiculoDominio,
        clienteNombre: turnoToModify.clienteNombre,
        fechaActual: turnoToModify.fecha,
        horaActual: turnoToModify.hora,
        nuevaFecha: f,
        nuevoHorario: h,
        nuevaSucursal: modNuevaSucursal || turnoToModify.sucursal
      });

      if (res.success) {
        setModSuccess(`Turno modificado correctamente para el ${res.fecha || f} a las ${res.hora || h} hs. Historial: ${(res.historialEstados || ['Reprogramado', 'Confirmado']).join(' ➔ ')}`);
        setTimeout(() => {
          setTurnoToModify(null);
          setModError(null);
          setModSuccess(null);
        }, 1500);
      } else {
        setModError(res.error || res.message || 'Error al modificar el turno');
      }
    } catch (err: any) {
      setModError(err.message || 'Error al modificar el turno');
    } finally {
      setIsModifying(false);
    }
  };

  // Estados para HU-15: Finalizar Turno (registrar presentación del vehículo)
  const [finTurnoId, setFinTurnoId] = useState<string>(() => turnos[0]?.id || '');
  const [finFechaHoy, setFinFechaHoy] = useState<string>('15/11/2026');
  const [finHoraActual, setFinHoraActual] = useState<string>('09:00');
  const [finError, setFinError] = useState<string | null>(null);
  const [finSuccess, setFinSuccess] = useState<string | null>(null);
  const [finResult, setFinResult] = useState<FinalizarTurnoResult | null>(null);
  const [isFinalizing, setIsFinalizing] = useState<boolean>(false);

  useEffect(() => {
    if (!finTurnoId && turnos.length > 0) {
      const tJuan = turnos.find(t => t.vehiculoDominio === 'AB123CD') || turnos[0];
      setFinTurnoId(tJuan.id);
    }
  }, [turnos, finTurnoId]);

  const handleFinalizarTurno = async () => {
    setFinError(null);
    setFinSuccess(null);
    setFinResult(null);

    const target = turnos.find(t => t.id === finTurnoId) || turnos[0];
    if (!target) {
      setFinError('Seleccione un turno para finalizar');
      return;
    }

    setIsFinalizing(true);
    try {
      const res = await finalizarTurno({
        turnoId: target.id,
        nroTurno: target.nroTurno,
        vehiculoDominio: target.vehiculoDominio,
        fechaActual: finFechaHoy,
        horaActual: finHoraActual,
        vehiculoPresentado: true
      });

      setFinResult(res);
      if (res.success) {
        setFinSuccess(res.message || 'Turno finalizado correctamente. Queda habilitado el registro del presupuesto');
        selectVehicleForReception(target.vehiculoDominio);
      } else {
        setFinError(res.error || res.message || 'Sólo se pueden finalizar turnos confirmados del día');
      }
    } catch (err: any) {
      setFinError(err.message || 'Error al finalizar el turno');
    } finally {
      setIsFinalizing(false);
    }
  };

  const handleMarcarAusente = async () => {
    setFinError(null);
    setFinSuccess(null);
    setFinResult(null);

    const target = turnos.find(t => t.id === finTurnoId) || turnos[0];
    if (!target) {
      setFinError('Seleccione un turno');
      return;
    }

    setIsFinalizing(true);
    try {
      const res = await registrarAusenciaTurno({
        turnoId: target.id,
        nroTurno: target.nroTurno,
        vehiculoDominio: target.vehiculoDominio,
        fechaActual: finFechaHoy,
        horaActual: finHoraActual,
        vehiculoPresentado: false
      });

      setFinResult(res);
      if (res.success) {
        setFinSuccess('El vehículo no se presentó a la hora programada. El turno pasó al estado "Ausente".');
      } else {
        setFinError(res.error || 'No se pudo marcar como ausente');
      }
    } catch (err: any) {
      setFinError(err.message || 'Error al procesar ausencia');
    } finally {
      setIsFinalizing(false);
    }
  };

  // Sincronizar selección de turno a confirmar
  useEffect(() => {
    if (!confirmTurnoId && turnos.length > 0) {
      const solicitado = turnos.find(t => t.estado === 'Solicitado') || turnos[0];
      setConfirmTurnoId(solicitado.id);
      setConfirmFechaHoraActual(computeOffsetDateTime(solicitado.fecha, solicitado.hora, -25));
    }
  }, [turnos, confirmTurnoId]);

  const selectedConfirmTurno = useMemo(() => {
    return turnos.find(t => t.id === confirmTurnoId) || turnos[0] || null;
  }, [turnos, confirmTurnoId]);

  const confirmHoursRemaining = useMemo(() => {
    if (!selectedConfirmTurno) return null;
    return calcHoursRemaining(selectedConfirmTurno.fecha, selectedConfirmTurno.hora, confirmFechaHoraActual);
  }, [selectedConfirmTurno, confirmFechaHoraActual]);

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

  // Envío del formulario para Registrar Turno
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

  // Acciones de presupuesto (HU-19: Registrar presupuesto de reparación)
  const activeVehicle = vehicles.find(v => v.plate === selectedReceptionVehicle || selectedReceptionVehicle.includes(v.plate)) || vehicles[0];
  const associatedClient = clients.find(c => c.id === activeVehicle?.clientId) || clients[0];

  const [presTurnoId, setPresTurnoId] = useState<string>(() => {
    const fin = turnos.find(t => t.estado === 'Finalizado') || turnos.find(t => t.vehiculoDominio === 'AB123CD') || turnos[0];
    return fin?.id || '';
  });
  const [presItems, setPresItems] = useState<DetallePresupuesto[]>([
    { id: 'item-1', descripcion: 'Aceite 5W30 (litro)', cantidad: 4, precioUnitario: 9000, subtotal: 36000 },
    { id: 'item-2', descripcion: 'Filtro de aceite', cantidad: 1, precioUnitario: 8000, subtotal: 8000 },
    { id: 'item-3', descripcion: 'Mano de obra', cantidad: 1, precioUnitario: 15000, subtotal: 15000 }
  ]);
  const [presValidezDias, setPresValidezDias] = useState<number>(15);
  const [presDescuentoPct, setPresDescuentoPct] = useState<number>(10);
  const [presFechaEmision, setPresFechaEmision] = useState<string>('15/11/2026');
  const [presFechaVencimientoSim, setPresFechaVencimientoSim] = useState<string>('01/12/2026');
  const [newItemDesc, setNewItemDesc] = useState<string>('');
  const [newItemCant, setNewItemCant] = useState<number>(1);
  const [newItemPrecio, setNewItemPrecio] = useState<number>(10000);
  const [presError, setPresError] = useState<string | null>(null);
  const [presSuccess, setPresSuccess] = useState<string | null>(null);
  const [currentPresupuesto, setCurrentPresupuesto] = useState<Presupuesto | null>(null);
  const [isSavingPresupuesto, setIsSavingPresupuesto] = useState<boolean>(false);

  const selectedPresTurno = useMemo(() => {
    return turnos.find(t => t.id === presTurnoId) || turnos[0];
  }, [turnos, presTurnoId]);

  // Sincronizar con presupuesto ya emitido para el turno seleccionado
  useEffect(() => {
    if (!selectedPresTurno) return;
    const found = presupuestos.find(p => p.turnoId === selectedPresTurno.id);
    if (found) {
      setCurrentPresupuesto(found);
      setPresItems(found.items);
      setPresValidezDias(found.validezDias);
      setPresDescuentoPct(found.descuentoPorcentaje);
      setPresFechaEmision(found.fechaEmision);
    } else {
      setCurrentPresupuesto(null);
    }
  }, [selectedPresTurno, presupuestos]);

  const isPresupuestoVencido = currentPresupuesto !== null && currentPresupuesto.estado !== 'Emitido';

  // Cálculos reactivos de DetallePresupuesto (Criterios 1 y 2)
  const calculatedSubtotal = useMemo(() => {
    return presItems.reduce((acc, item) => acc + Math.round(item.cantidad * item.precioUnitario * 100) / 100, 0);
  }, [presItems]);

  const calculatedDescuento = useMemo(() => {
    const pct = Math.max(0, Number(presDescuentoPct) || 0);
    return Math.round(calculatedSubtotal * (pct / 100) * 100) / 100;
  }, [calculatedSubtotal, presDescuentoPct]);

  const calculatedTotal = useMemo(() => {
    return Math.round((calculatedSubtotal - calculatedDescuento) * 100) / 100;
  }, [calculatedSubtotal, calculatedDescuento]);

  const handleUpdatePresItem = (index: number, field: 'descripcion' | 'cantidad' | 'precioUnitario', value: string | number) => {
    if (isPresupuestoVencido) return;
    setPresItems(prev => prev.map((it, idx) => {
      if (idx !== index) return it;
      const updated = { ...it, [field]: field === 'descripcion' ? String(value) : Number(value) };
      updated.subtotal = Math.round(updated.cantidad * updated.precioUnitario * 100) / 100;
      return updated;
    }));
  };

  const handleRemovePresItem = (index: number) => {
    if (isPresupuestoVencido) return;
    setPresItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleAddPresItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPresupuestoVencido) return;
    if (!newItemDesc.trim() || newItemCant <= 0 || newItemPrecio < 0) return;
    const sub = Math.round(newItemCant * newItemPrecio * 100) / 100;
    setPresItems(prev => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        descripcion: newItemDesc.trim(),
        cantidad: Number(newItemCant),
        precioUnitario: Number(newItemPrecio),
        subtotal: sub
      }
    ]);
    setNewItemDesc('');
    setNewItemCant(1);
    setNewItemPrecio(10000);
    setIsAddingService(false);
  };

  const handleRegistrarPresupuesto = async () => {
    setPresError(null);
    setPresSuccess(null);

    if (!selectedPresTurno) {
      setPresError('Seleccione un turno para registrar el presupuesto');
      return;
    }

    if (isPresupuestoVencido) {
      setPresError(`El presupuesto se encuentra en estado "${currentPresupuesto?.estado}" y ya no se puede modificar`);
      return;
    }

    setIsSavingPresupuesto(true);
    try {
      // Si el turno aún está en estado "Confirmado", finalizarlo primero o informar
      let res: RegistrarPresupuestoResult;
      if (currentPresupuesto) {
        res = await modificarPresupuesto({
          presupuestoId: currentPresupuesto.id,
          turnoId: selectedPresTurno.id,
          validezDias: presValidezDias,
          descuentoFidelizacionPorcentaje: presDescuentoPct,
          items: presItems.map(it => ({
            descripcion: it.descripcion,
            cantidad: it.cantidad,
            precioUnitario: it.precioUnitario
          }))
        });
      } else {
        res = await registrarPresupuesto({
          turnoId: selectedPresTurno.id,
          vehiculoDominio: selectedPresTurno.vehiculoDominio,
          clienteNombre: selectedPresTurno.clienteNombre,
          descuentoFidelizacionPorcentaje: presDescuentoPct,
          validezDias: presValidezDias,
          fechaEmision: presFechaEmision,
          items: presItems.map(it => ({
            descripcion: it.descripcion,
            cantidad: it.cantidad,
            precioUnitario: it.precioUnitario
          }))
        });
      }

      if (res.success && res.presupuesto) {
        setCurrentPresupuesto(res.presupuesto);
        setPresSuccess(
          `Presupuesto ${res.presupuesto.nroPresupuesto} en estado "${res.presupuesto.estado}" • Subtotal: $${res.presupuesto.subtotal.toLocaleString()} • Descuento: $${res.presupuesto.descuento.toLocaleString()} • Total: $${res.presupuesto.total.toLocaleString()}`
        );
      } else {
        setPresError(res.error || res.message || 'Error al registrar el presupuesto');
      }
    } catch (err: any) {
      setPresError(err.message || 'Error al registrar el presupuesto');
    } finally {
      setIsSavingPresupuesto(false);
    }
  };

  const handleVerificarVencimiento = async () => {
    setPresError(null);
    setPresSuccess(null);
    if (!currentPresupuesto && !selectedPresTurno) {
      setPresError('Primero debe registrar y emitir el presupuesto');
      return;
    }

    setIsSavingPresupuesto(true);
    try {
      const res = await verificarVencimientoPresupuesto({
        presupuestoId: currentPresupuesto?.id,
        turnoId: selectedPresTurno?.id,
        fechaActual: presFechaVencimientoSim,
        respuestaCliente: null
      });

      if (res.success && res.presupuesto) {
        setCurrentPresupuesto(res.presupuesto);
        if (res.presupuesto.estado === 'Vencido') {
          setPresSuccess(
            `Al llegar el ${presFechaVencimientoSim} sin respuesta del cliente, el presupuesto pasó al estado "Vencido" y ya no se puede modificar.`
          );
        } else {
          setPresSuccess(res.message);
        }
      } else {
        setPresError(res.error || 'No se pudo verificar el vencimiento');
      }
    } finally {
      setIsSavingPresupuesto(false);
    }
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
            <span>Atención: El turno requiere confirmación con 24 hs de anticipación</span>
            <span className="badge-yellow text-[10px] py-0.5">Regla Operativa</span>
          </h3>
          <p className="text-xs text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
            La orden no ingresará a línea de taller hasta la confirmación telefónica o digital del cliente y la reserva de los repuestos en pañol.
          </p>
        </div>
      </div>

      {/* PESTAÑAS DE NAVEGACIÓN DENTRO DE RECEPCIÓN */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-[#3A3A48] pb-3">
        <button
          onClick={() => setActiveTab('agenda')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
            activeTab === 'agenda'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <ListFilter className="w-4 h-4" />
          <span>Agenda de Turnos ({turnos.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('nuevo-turno')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
            activeTab === 'nuevo-turno'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Turno</span>
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
          <span>Disponibilidad Horaria</span>
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
          <span>Confirmar Turno</span>
        </button>

        <button
          onClick={() => setActiveTab('finalizar-turno')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
            activeTab === 'finalizar-turno'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Car className="w-4 h-4" />
          <span>Recepción de Vehículo</span>
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
          <span>Presupuestos</span>
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
                    Se muestran únicamente los horarios libres de la sucursal
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
                <span>Consultar Disponibilidad Horaria por Sucursal y Fecha</span>
              </h2>
              <span className="text-xs text-slate-500">
                Consulta de agenda en tiempo real
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
                  Horarios dentro de la franja de atención de la sucursal seleccionada
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
                      <span>Horarios Reservados ({dispResult.horariosOcupados.length})</span>
                    </h3>
                    <span className="text-[10px] text-slate-400">No disponibles</span>
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
      {/* VISTA: CONFIRMAR TURNO */}
      {/* ============================================================ */}
      {activeTab === 'confirmar-turno' && (
        <div className="card-surface rounded-2xl p-6 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-[#3A3A48]">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <CheckCheck className="w-5 h-5 text-emerald-600" />
                <span>Confirmar Turno</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Registro de confirmación de turnos por correo electrónico o mensajería con al menos 24 horas de anticipación.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-emerald-400 border border-amber-300 dark:border-amber-800">
                Anticipación mínima: 24 hs
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
                  {confirmError.toLowerCase().includes('plazo')
                    ? 'El turno no puede confirmarse porque faltan menos de 24 hs para el horario programado. El turno conserva su estado anterior.'
                    : 'Verifique el estado actual del turno seleccionado y su historial de cambios de estado.'}
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
                  Se cerró el <strong>CambioEstadoTurno "Solicitado"</strong> (fecha/hora de fin) y se creó el nuevo <strong>CambioEstadoTurno "Confirmado"</strong> (fecha/hora de inicio) junto con fecha, hora y medio de confirmación.
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
                No hay turnos registrados aún.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {turnos.map(t => {
                  const isSelected = t.id === confirmTurnoId;
                  const isConfirmado = t.estado === 'Confirmado';
                  const cambios = t.cambiosEstado || t.cambios_estado || [];
                  const cambioVigente = cambios.find(c => c.fechaFin === null && c.fecha_fin === null) || cambios[cambios.length - 1];
                  const hist = t.historialEstados || t.historial_estados || [t.estado];
                  return (
                    <div
                      key={t.id}
                      onClick={() => {
                        setConfirmTurnoId(t.id);
                        setConfirmError(null);
                        setConfirmSuccess(null);
                        setConfirmResult(null);
                        setConfirmFechaHoraActual(computeOffsetDateTime(t.fecha, t.hora, -25));
                      }}
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
                        <div className="pt-1 text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-200/70 dark:border-[#2A2A38]">
                          <div><strong>Historial:</strong> {hist.join(' → ')}</div>
                          {cambioVigente && (
                            <div className="font-mono text-[9px] mt-0.5">
                              Vigente desde {cambioVigente.fechaInicio || cambioVigente.fecha_inicio} {cambioVigente.horaInicio || cambioVigente.hora_inicio} hs
                            </div>
                          )}
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

              {/* FECHA Y HORA DE CONFIRMACIÓN */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    3. Fecha y Hora de Confirmación <span className="text-red-600 font-bold">*</span>
                  </label>
                  {confirmHoursRemaining !== null && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      confirmHoursRemaining >= 24
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300'
                    }`}>
                      Faltan {confirmHoursRemaining} hs {confirmHoursRemaining >= 24 ? '(En plazo ≥ 24h)' : '(Fuera de plazo < 24h)'}
                    </span>
                  )}
                </div>

                <input
                  type="text"
                  value={confirmFechaHoraActual}
                  onChange={(e) => setConfirmFechaHoraActual(e.target.value)}
                  placeholder="DD/MM/YYYY HH:mm"
                  className="app-input w-full px-3 py-2 text-xs font-mono font-bold"
                />

                {selectedConfirmTurno && (
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setConfirmFechaHoraActual(computeOffsetDateTime(selectedConfirmTurno.fecha, selectedConfirmTurno.hora, -25))}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                    >
                      Faltando 25 hs ({computeOffsetDateTime(selectedConfirmTurno.fecha, selectedConfirmTurno.hora, -25)})
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmFechaHoraActual(computeOffsetDateTime(selectedConfirmTurno.fecha, selectedConfirmTurno.hora, -24))}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                    >
                      Límite 24 hs ({computeOffsetDateTime(selectedConfirmTurno.fecha, selectedConfirmTurno.hora, -24)})
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmFechaHoraActual(computeOffsetDateTime(selectedConfirmTurno.fecha, selectedConfirmTurno.hora, -23))}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                    >
                      Faltando 23 hs ({computeOffsetDateTime(selectedConfirmTurno.fecha, selectedConfirmTurno.hora, -23)})
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmFechaHoraActual(formatDateTimeDisplayLocal(new Date()))}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    >
                      Ahora
                    </button>
                  </div>
                )}

                <p className="text-[11px] text-slate-400">
                  Fecha/hora utilizada para validar el plazo ≥ 24 hs y registrar el cierre/inicio de <code>CambioEstadoTurno</code>.
                </p>
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

            <div className="flex items-center space-x-2">
              {selectedConfirmTurno && (
                <button
                  type="button"
                  onClick={() => setTurnoHistorialModal(selectedConfirmTurno)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center space-x-1.5"
                >
                  <History className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Ver Historial Completo</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveTab('agenda')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Ver en Agenda
              </button>
            </div>
          </div>

          {/* DETALLE DE CAMBIO DE ESTADO DE TURNO + NOTIFICACIÓN */}
          {confirmResult?.success && (
            <div className="space-y-4 animate-in fade-in">
              {/* Trazabilidad CambioEstadoTurno */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1A1A22] border border-slate-200 dark:border-[#3A3A48] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 dark:text-white">
                    <History className="w-4 h-4 text-emerald-600" />
                    <span>Registro de CambioEstadoTurno (MODP / HU-11)</span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                    Historial: {(confirmResult.historialEstados || confirmResult.historial_estados || ['Solicitado', 'Confirmado']).join(' ➔ ')}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {(confirmResult.cambioEstadoCerrado || confirmResult.cambio_estado_cerrado) && (() => {
                    const cerrado = confirmResult.cambioEstadoCerrado || confirmResult.cambio_estado_cerrado!;
                    return (
                      <div className="p-3 rounded-lg bg-white dark:bg-[#121218] border border-amber-200 dark:border-amber-900/50 space-y-1">
                        <div className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400">
                          Estado Cerrado: {cerrado.estado}
                        </div>
                        <div className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                          Inicio: {cerrado.fechaInicio || cerrado.fecha_inicio} {cerrado.horaInicio || cerrado.hora_inicio} hs
                        </div>
                        <div className="font-mono text-[11px] font-bold text-amber-700 dark:text-amber-300">
                          Fin: {cerrado.fechaFin || cerrado.fecha_fin} {cerrado.horaFin || cerrado.hora_fin} hs
                        </div>
                      </div>
                    );
                  })()}

                  {(confirmResult.cambioEstadoActual || confirmResult.cambio_estado_actual) && (() => {
                    const actual = confirmResult.cambioEstadoActual || confirmResult.cambio_estado_actual!;
                    return (
                      <div className="p-3 rounded-lg bg-white dark:bg-[#121218] border border-emerald-200 dark:border-emerald-900/50 space-y-1">
                        <div className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">
                          Nuevo Estado Vigente: {actual.estado}
                        </div>
                        <div className="font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                          Inicio: {actual.fechaInicio || actual.fecha_inicio} {actual.horaInicio || actual.hora_inicio} hs
                        </div>
                        <div className="font-mono text-[11px] text-slate-500">
                          Fin: En curso (vigente) • Medio: {confirmResult.medioConfirmacion}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {confirmResult.notificacion && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1A1A22] border border-emerald-200 dark:border-emerald-900/60 space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Notificación Enviada al Cliente</span>
                  </div>
                  <div className="text-xs text-slate-700 dark:text-slate-300 font-mono bg-white dark:bg-[#121218] p-3 rounded-lg border border-slate-200 dark:border-[#2A2A38]">
                    <div><strong>Destinatario:</strong> {confirmResult.notificacion.destinatario} ({confirmResult.notificacion.medio})</div>
                    <div><strong>Fecha del Turno:</strong> {confirmResult.notificacion.fechaTurno || confirmResult.notificacion.fecha_turno}</div>
                    <div><strong>Hora del Turno:</strong> {confirmResult.notificacion.horaTurno || confirmResult.notificacion.hora_turno} hs</div>
                    <div className="mt-1 text-slate-500 italic">"{confirmResult.notificacion.mensaje}"</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* VISTA: CONSULTAR TURNOS POR ESTADO, FECHA Y SUCURSAL */}
      {/* ============================================================ */}
      {activeTab === 'agenda' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Panel de Filtros Combinables y Ordenamiento */}
          <div className="card-surface rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-[#3A3A48]">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <ListFilter className="w-4 h-4 text-red-600" />
                  <span>Agenda y Consulta de Turnos</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Filtre por estado, rango de fechas y sucursal para organizar la atención del día.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
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
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center space-x-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Limpiar filtros</span>
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
                  <option value="Finalizado">Finalizado</option>
                  <option value="Ausente">Ausente</option>
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
                          ) : t.estado === 'Finalizado' ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-300 dark:border-blue-800">
                              <CheckCircle2 className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                              <span>Finalizado</span>
                            </span>
                          ) : t.estado === 'Ausente' ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-400 border border-red-300 dark:border-red-800">
                              <span>Ausente</span>
                            </span>
                          ) : t.estado === 'Cancelado' ? (
                            <div className="space-y-0.5">
                              <span className="badge-gray text-[10px] px-2.5 py-0.5 font-bold">
                                Cancelado
                              </span>
                              {t.motivoCancelacion && (
                                <div className="text-[9px] text-slate-500 italic max-w-xs truncate" title={t.motivoCancelacion}>
                                  Motivo: {t.motivoCancelacion}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="badge-yellow text-[10px] px-2.5 py-0.5 font-bold">
                              {t.estado}
                            </span>
                          )}
                          {(t.historialEstados || t.historial_estados) && (t.historialEstados || t.historial_estados)!.length > 0 && (
                            <div className="text-[9px] text-slate-500 dark:text-slate-400 mt-1 max-w-[180px] truncate" title={(t.historialEstados || t.historial_estados)!.join(' → ')}>
                              {(t.historialEstados || t.historial_estados)!.join(' → ')}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex flex-wrap items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setTurnoHistorialModal(t)}
                              className="px-2.5 py-1 bg-slate-500/10 hover:bg-slate-500/20 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold border border-slate-500/20 transition-colors flex items-center space-x-1"
                              title="Ver historial de CambioEstadoTurno"
                            >
                              <History className="w-3 h-3" />
                              <span>Historial</span>
                            </button>
                            {t.estado === 'Solicitado' && (
                              <button
                                onClick={() => {
                                  setConfirmTurnoId(t.id);
                                  setConfirmError(null);
                                  setConfirmSuccess(null);
                                  setConfirmResult(null);
                                  setConfirmFechaHoraActual(computeOffsetDateTime(t.fecha, t.hora, -25));
                                  setActiveTab('confirmar-turno');
                                }}
                                className="px-2.5 py-1 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-bold border border-emerald-600/20 transition-colors flex items-center space-x-1"
                                title="Confirmar turno"
                              >
                                <CheckCheck className="w-3 h-3" />
                                <span>Confirmar</span>
                              </button>
                            )}
                            {t.estado === 'Confirmado' && (
                              <button
                                onClick={() => {
                                  setFinTurnoId(t.id);
                                  setFinFechaHoy(t.fecha);
                                  setActiveTab('finalizar-turno');
                                }}
                                className="px-2.5 py-1 bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-bold border border-blue-600/20 transition-colors flex items-center space-x-1"
                                title="Registrar presentación del vehículo"
                              >
                                <Car className="w-3 h-3" />
                                <span>Finalizar</span>
                              </button>
                            )}
                            {(t.estado === 'Solicitado' || t.estado === 'Confirmado') && (
                              <button
                                onClick={() => {
                                  setTurnoToModify(t);
                                  setModNuevaFecha('16/11/2026');
                                  setModNuevoHorario('10:00');
                                  setModNuevaSucursal(t.sucursal);
                                  setModError(null);
                                  setModSuccess(null);
                                }}
                                className="px-2.5 py-1 bg-amber-600/10 hover:bg-amber-600/20 text-amber-600 dark:text-amber-400 rounded-lg text-[10px] font-bold border border-amber-600/20 transition-colors flex items-center space-x-1"
                                title="Modificar fecha u horario del turno (HU-13)"
                              >
                                <CalendarClock className="w-3 h-3" />
                                <span>Modificar</span>
                              </button>
                            )}
                            {(t.estado === 'Solicitado' || t.estado === 'Confirmado') && (
                              <button
                                onClick={() => {
                                  setTurnoToCancel(t);
                                  setMotivoCancelacionInput('');
                                  setCancelModalError(null);
                                  setCancelModalSuccess(null);
                                }}
                                className="px-2.5 py-1 bg-red-600/10 hover:bg-red-600/20 text-red-600 dark:text-red-400 rounded-lg text-[10px] font-bold border border-red-600/20 transition-colors flex items-center space-x-1"
                                title="Cancelar turno indicando motivo (HU-12)"
                              >
                                <Ban className="w-3 h-3" />
                                <span>Cancelar</span>
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
      {/* VISTA: FINALIZAR TURNO (REGISTRAR PRESENTACIÓN DEL VEHÍCULO) */}
      {/* ============================================================ */}
      {activeTab === 'finalizar-turno' && (
        <div className="card-surface rounded-2xl p-6 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-[#3A3A48]">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Car className="w-5 h-5 text-red-600" />
                <span>Recepción de Vehículo (Finalizar Turno)</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Registre la presentación del vehículo en la sucursal para finalizar el turno confirmado y habilitar el presupuesto.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                Turnos Confirmados del Día
              </span>
            </div>
          </div>

          {/* MENSAJES DE ESTADO (ÉXITO / ERROR) */}
          {finError && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-400 text-xs flex items-start space-x-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
              <div>
                <p className="font-bold text-sm">{finError}</p>
                <p className="text-[11px] mt-1 text-red-600/90 dark:text-red-400/90">
                  El turno permanece en su estado original y el registro de presupuesto no fue habilitado.
                </p>
              </div>
            </div>
          )}

          {finSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-start justify-between gap-4 animate-in fade-in">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
                <div className="space-y-1">
                  <p className="font-bold text-sm">{finSuccess}</p>
                  {finResult?.estado === 'Finalizado' && (
                    <p className="text-[11px]">
                      Estado del turno: <strong>"Finalizado"</strong> • Registro del presupuesto: <strong className="text-emerald-600 dark:text-emerald-400">HABILITADO</strong>
                    </p>
                  )}
                </div>
              </div>
              {finResult?.presupuestoHabilitado && (
                <button
                  type="button"
                  onClick={() => setActiveTab('presupuesto')}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center space-x-1.5 shrink-0 shadow-sm"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Registrar Presupuesto del Turno</span>
                </button>
              )}
            </div>
          )}

          {/* SELECTOR DE TURNO */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Seleccione el Turno / Vehículo <span className="text-red-600">*</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {turnos.map(t => {
                const isSelected = t.id === finTurnoId;
                return (
                  <div
                    key={t.id}
                    onClick={() => setFinTurnoId(t.id)}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-red-500 bg-red-50/40 dark:bg-red-950/20 ring-2 ring-red-500/20 shadow-sm'
                        : 'border-slate-200 dark:border-[#3A3A48] bg-slate-50/50 dark:bg-[#1A1A22]/60 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#2A2A38]">
                      <span className="font-mono font-bold text-red-600">#{t.nroTurno} • {t.vehiculoDominio}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        t.estado === 'Finalizado'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400'
                          : t.estado === 'Confirmado'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : t.estado === 'Ausente'
                          ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-400'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                      }`}>
                        {t.estado}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1">
                      <div className="font-bold text-slate-900 dark:text-white">{t.clienteNombre || t.cliente}</div>
                      <div className="text-[11px] text-slate-500">Motivo: {t.motivoConsulta}</div>
                      <div className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
                        Fecha: {t.fecha} • Hora: {t.hora} hs ({t.sucursal})
                      </div>
                      {t.presupuestoHabilitado && (
                        <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 pt-1">
                          ✓ Registro de presupuesto habilitado
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* FECHA Y HORA DE RECEPCIÓN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-[#3A3A48]">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Fecha de Recepción
              </label>
              <input
                type="text"
                value={finFechaHoy}
                onChange={(e) => setFinFechaHoy(e.target.value)}
                placeholder="DD/MM/YYYY"
                className="app-input w-full px-3 py-2 text-xs font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Hora de Recepción
              </label>
              <input
                type="text"
                value={finHoraActual}
                onChange={(e) => setFinHoraActual(e.target.value)}
                placeholder="HH:mm"
                className="app-input w-full px-3 py-2 text-xs font-mono font-bold"
              />
            </div>
          </div>

          {/* BOTONES DE ACCIÓN HU-15 */}
          <div className="pt-4 border-t border-slate-200 dark:border-[#3A3A48] flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleFinalizarTurno}
                disabled={isFinalizing || !finTurnoId}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center space-x-2 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Registrar que el cliente presentó el vehículo (Finalizar turno)</span>
              </button>

              <button
                type="button"
                onClick={handleMarcarAusente}
                disabled={isFinalizing || !finTurnoId}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-red-600/10 hover:bg-red-600/20 text-red-600 dark:text-red-400 border border-red-500/30 flex items-center space-x-2 transition-all"
              >
                <UserX className="w-4 h-4" />
                <span>El vehículo no se presentó (Pasar a "Ausente")</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('presupuesto')}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-1.5"
            >
              <FileCheck className="w-4 h-4 text-red-600" />
              <span>Ir a Presupuesto</span>
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* VISTA: REGISTRAR PRESUPUESTO DE REPARACIÓN */}
      {/* ============================================================ */}
      {activeTab === 'presupuesto' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* CABECERA DEL PRESUPUESTO */}
          <div className="card-surface rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-[#3A3A48]">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <FileCheck className="w-5 h-5 text-red-600" />
                  <span>Registrar Presupuesto de Reparación</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Detalle los repuestos y mano de obra para emitir el presupuesto correspondiente al turno finalizado.
                </p>
              </div>

              {/* Estado actual del presupuesto */}
              <div className="flex items-center space-x-2">
                {currentPresupuesto ? (
                  <span className={`px-3 py-1 rounded-full text-xs font-black border ${
                    currentPresupuesto.estado === 'Emitido'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border-red-400'
                  }`}>
                    Estado: {currentPresupuesto.estado} {currentPresupuesto.estado === 'Vencido' ? '(No modificable)' : '(Modificable)'}
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    Pendiente de Emisión
                  </span>
                )}
              </div>
            </div>

            {/* Mensajes de confirmación o error */}
            {presError && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-400 text-xs flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
                <div>
                  <p className="font-bold text-sm">{presError}</p>
                </div>
              </div>
            )}

            {presSuccess && (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
                <div>
                  <p className="font-bold text-sm">{presSuccess}</p>
                </div>
              </div>
            )}

            {/* Selección de Turno Finalizado, Descuento de Fidelización y Días de Validez */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  1. Turno Asociado <span className="text-red-600">*</span>
                </label>
                <select
                  value={presTurnoId}
                  onChange={(e) => setPresTurnoId(e.target.value)}
                  className="app-input w-full px-3 py-2 text-xs font-bold cursor-pointer"
                >
                  {turnos.map(t => (
                    <option key={t.id} value={t.id}>
                      #{t.nroTurno} • {t.vehiculoDominio} - {t.clienteNombre || t.cliente} ({t.estado})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  2. Fecha de Emisión
                </label>
                <input
                  type="text"
                  value={presFechaEmision}
                  disabled={isPresupuestoVencido}
                  onChange={(e) => setPresFechaEmision(e.target.value)}
                  className="app-input w-full px-3 py-2 text-xs font-mono font-bold disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  3. Validez (días) <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={presValidezDias}
                  disabled={isPresupuestoVencido}
                  onChange={(e) => setPresValidezDias(Number(e.target.value))}
                  className="app-input w-full px-3 py-2 text-xs font-mono font-bold disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  4. Descuento Fidelización (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={presDescuentoPct}
                  disabled={isPresupuestoVencido}
                  onChange={(e) => setPresDescuentoPct(Number(e.target.value))}
                  className="app-input w-full px-3 py-2 text-xs font-mono font-bold disabled:opacity-60"
                />
              </div>
            </div>
          </div>

          {/* TABLA DE ÍTEMS DE DETALLE */}
          <div className="card-surface rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#3A3A48]">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" />
                  <span>Detalle del Presupuesto (Repuestos y Mano de Obra)</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Cada ítem registra descripción, cantidad, precio unitario y subtotal.
                </p>
              </div>

              {!isPresupuestoVencido && (
                <button
                  type="button"
                  onClick={() => setIsAddingService(true)}
                  className="px-3 py-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-600 border border-red-600/20 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Agregar Ítem</span>
                </button>
              )}
            </div>

            {isAddingService && !isPresupuestoVencido && (
              <form onSubmit={handleAddPresItem} className="p-4 rounded-xl bg-slate-50 dark:bg-[#1E1E24] border border-red-500/30 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-6">
                  <label className="block text-xs font-bold mb-1">Descripción (Repuesto o Mano de obra) *</label>
                  <input
                    type="text"
                    required
                    value={newItemDesc}
                    onChange={(e) => setNewItemDesc(e.target.value)}
                    placeholder="ej: Filtro de aire / Mano de obra"
                    className="app-input w-full px-3 py-2 text-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold mb-1">Cantidad *</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={newItemCant}
                    onChange={(e) => setNewItemCant(Number(e.target.value))}
                    className="app-input w-full px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold mb-1">Precio Unitario ($) *</label>
                  <input
                    type="number"
                    min="0"
                    value={newItemPrecio}
                    onChange={(e) => setNewItemPrecio(Number(e.target.value))}
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
                    <th className="px-4 py-3">Descripción</th>
                    <th className="px-4 py-3 w-32">Cantidad</th>
                    <th className="px-4 py-3 w-40">Precio Unitario</th>
                    <th className="px-4 py-3 w-40 text-right">Subtotal</th>
                    <th className="px-4 py-3 w-20 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-[#3A3A48]">
                  {presItems.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50 dark:hover:bg-[#202028]">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                        <input
                          type="text"
                          value={item.descripcion}
                          disabled={isPresupuestoVencido}
                          onChange={(e) => handleUpdatePresItem(idx, 'descripcion', e.target.value)}
                          className="app-input w-full px-2.5 py-1 text-xs font-semibold disabled:opacity-60"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="1"
                          value={item.cantidad}
                          disabled={isPresupuestoVencido}
                          onChange={(e) => handleUpdatePresItem(idx, 'cantidad', Number(e.target.value))}
                          className="app-input w-24 px-2 py-1 text-center font-mono font-bold disabled:opacity-60"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          value={item.precioUnitario}
                          disabled={isPresupuestoVencido}
                          onChange={(e) => handleUpdatePresItem(idx, 'precioUnitario', Number(e.target.value))}
                          className="app-input w-32 px-2 py-1 font-mono font-bold disabled:opacity-60"
                        />
                      </td>
                      <td className="px-4 py-3 font-mono font-black text-slate-900 dark:text-white text-right">
                        $ {item.subtotal.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          disabled={isPresupuestoVencido || presItems.length <= 1}
                          onClick={() => handleRemovePresItem(idx)}
                          className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-30"
                        >
                          <Trash2 className="w-4 h-4 mx-auto" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totales del Presupuesto (Criterio 2: Subtotal, Descuento de Fidelización y Total) */}
            <div className="pt-4 border-t border-slate-200 dark:border-[#3A3A48] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="text-xs text-slate-500 space-y-1">
                <p>• Validez del presupuesto: <strong>{presValidezDias} días</strong> desde la emisión ({presFechaEmision}).</p>
                <p>• Al registrarse, queda en estado <strong>"Emitido"</strong> y puede modificarse mientras continúe en ese estado.</p>
                <p>• Si se superan los {presValidezDias} días sin respuesta del cliente, pasa a <strong>"Vencido"</strong> y se bloquea su edición.</p>
              </div>

              <div className="w-full sm:w-80 space-y-2 text-xs text-right bg-slate-50 dark:bg-[#1E1E24] p-4 rounded-xl border border-slate-200 dark:border-[#3A3A48]">
                <div className="flex justify-between text-slate-600 dark:text-slate-300 font-semibold">
                  <span>Subtotal:</span>
                  <span className="font-mono font-bold">$ {calculatedSubtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>Descuento fidelización ({presDescuentoPct}%):</span>
                  <span className="font-mono font-bold">- $ {calculatedDescuento.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-base font-black text-slate-900 dark:text-white border-t border-slate-200 dark:border-[#3A3A48] pt-2">
                  <span>Total:</span>
                  <span className="text-red-600 font-mono font-black">$ {calculatedTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Botón de Acción Principal: "Registrar presupuesto" */}
            <div className="pt-4 flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 dark:border-[#3A3A48]">
              <button
                type="button"
                disabled={isSavingPresupuesto || isPresupuestoVencido}
                onClick={handleRegistrarPresupuesto}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/30 disabled:opacity-40 transition-all flex items-center space-x-2"
              >
                <FileCheck className="w-4 h-4" />
                <span>Registrar presupuesto</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL HU-12: CANCELAR TURNO */}
      {/* ============================================================ */}
      {turnoToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="card-surface w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-[#3A3A48] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#3A3A48]">
              <div className="flex items-center space-x-2 text-red-600">
                <Ban className="w-5 h-5" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Cancelar Turno #{turnoToCancel.nroTurno}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setTurnoToCancel(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1A1A22] border border-slate-200 dark:border-[#2A2A38] text-xs space-y-1">
              <div><strong>Cliente:</strong> {turnoToCancel.clienteNombre || turnoToCancel.cliente}</div>
              <div><strong>Vehículo:</strong> <span className="font-mono">{turnoToCancel.vehiculoDominio || turnoToCancel.patente}</span></div>
              <div><strong>Sucursal:</strong> {turnoToCancel.sucursal}</div>
              <div><strong>Fecha y Hora:</strong> {turnoToCancel.fecha} a las {turnoToCancel.hora} hs</div>
              <div><strong>Estado Actual:</strong> <span className="font-bold text-amber-600">{turnoToCancel.estado}</span></div>
            </div>

            {cancelModalError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-400 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span className="font-bold">{cancelModalError}</span>
              </div>
            )}

            {cancelModalSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span className="font-bold">{cancelModalSuccess}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Motivo de cancelación <span className="text-red-600 font-bold">*</span>
              </label>
              <textarea
                value={motivoCancelacionInput}
                onChange={(e) => setMotivoCancelacionInput(e.target.value)}
                placeholder="Ingrese el motivo de cancelación obligatorio..."
                rows={3}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#3A3A48] bg-white dark:bg-[#1A1A22] text-slate-900 dark:text-white resize-none"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setMotivoCancelacionInput('El cliente no puede asistir')}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                >
                  "El cliente no puede asistir"
                </button>
                <button
                  type="button"
                  onClick={() => setMotivoCancelacionInput('Reprogramación solicitada por el cliente')}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                >
                  "Reprogramación solicitada"
                </button>
                <button
                  type="button"
                  onClick={() => setMotivoCancelacionInput('')}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 hover:bg-amber-200"
                >
                  Vaciar motivo
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-[#3A3A48] flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setTurnoToCancel(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={handleCancelarTurno}
                disabled={isCanceling}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20 disabled:opacity-50 flex items-center space-x-1.5 transition-all"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>{isCanceling ? 'Cancelando...' : 'Cancelar turno'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL HU-13: MODIFICAR TURNO */}
      {/* ============================================================ */}
      {turnoToModify && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="card-surface w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-[#3A3A48] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#3A3A48]">
              <div className="flex items-center space-x-2 text-amber-600">
                <CalendarClock className="w-5 h-5" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Modificar Turno #{turnoToModify.nroTurno}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setTurnoToModify(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1A1A22] border border-slate-200 dark:border-[#2A2A38] text-xs space-y-1">
              <div><strong>Cliente:</strong> {turnoToModify.clienteNombre || turnoToModify.cliente}</div>
              <div><strong>Vehículo:</strong> <span className="font-mono">{turnoToModify.vehiculoDominio || turnoToModify.patente}</span></div>
              <div><strong>Sucursal actual:</strong> {turnoToModify.sucursal}</div>
              <div><strong>Fecha y Hora actual:</strong> {turnoToModify.fecha} a las {turnoToModify.hora} hs</div>
              <div><strong>Estado Actual:</strong> <span className="font-bold text-emerald-600">{turnoToModify.estado}</span></div>
              {(turnoToModify.historialEstados || turnoToModify.historial_estados) && (turnoToModify.historialEstados || turnoToModify.historial_estados)!.length > 0 && (
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  <strong>Historial de estados:</strong> {(turnoToModify.historialEstados || turnoToModify.historial_estados)!.join(' ➔ ')}
                </div>
              )}
              {(turnoToModify.cambiosEstado || turnoToModify.cambios_estado) && (turnoToModify.cambiosEstado || turnoToModify.cambios_estado)!.length > 0 && (
                <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 pt-1">
                  <strong>Cambios registrados:</strong> {(turnoToModify.cambiosEstado || turnoToModify.cambios_estado)!.length} ({(turnoToModify.cambiosEstado || turnoToModify.cambios_estado)!.map((c: CambioEstadoTurno) => `${c.estado} [${c.fechaInicio || c.fecha_inicio} ${c.horaInicio || c.hora_inicio} → ${c.fechaFin || c.fecha_fin || 'Vigente'}]`).join(' | ')})
                </div>
              )}
            </div>

            {modError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-400 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{modError}</span>
              </div>
            )}

            {modSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-400 text-xs flex items-center space-x-2">
                <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                <span className="font-bold">{modSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nueva Fecha <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={modNuevaFecha}
                  onChange={(e) => setModNuevaFecha(e.target.value)}
                  placeholder="DD/MM/YYYY o YYYY-MM-DD"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#3A3A48] bg-white dark:bg-[#1A1A22] text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nuevo Horario <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={modNuevoHorario}
                  onChange={(e) => setModNuevoHorario(e.target.value)}
                  placeholder="HH:mm (ej: 10:00)"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#3A3A48] bg-white dark:bg-[#1A1A22] text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Sucursal
              </label>
              <select
                value={modNuevaSucursal || turnoToModify.sucursal}
                onChange={(e) => setModNuevaSucursal(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#3A3A48] bg-white dark:bg-[#1A1A22] text-slate-900 dark:text-white"
              >
                {sucursales.map(s => (
                  <option key={s.id} value={s.nombre}>{s.nombre} ({s.horarioApertura} a {s.horarioCierre})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] text-slate-500 font-semibold uppercase">Accesos rápidos BDD (HU-13):</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setModNuevaFecha('16/11/2026');
                    setModNuevoHorario('10:00');
                    setModNuevaSucursal('Centro');
                  }}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100"
                >
                  "16/11/2026 10:00" (Horario disponible)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModNuevaFecha('16/11/2026');
                    setModNuevoHorario('10:00');
                    setModNuevaSucursal('Centro');
                  }}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                >
                  "16/11/2026 10:00" (Prueba Colisión)
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-[#3A3A48] flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setTurnoToModify(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={handleModificarTurno}
                disabled={isModifying}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20 disabled:opacity-50 flex items-center space-x-1.5 transition-all"
              >
                <CalendarClock className="w-3.5 h-3.5" />
                <span>{isModifying ? 'Guardando...' : 'Guardar cambios'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: HISTORIAL DE CAMBIOS DE ESTADO (CambioEstadoTurno) */}
      {/* ============================================================ */}
      {turnoHistorialModal && (() => {
        const historial = turnoHistorialModal.historialEstados || turnoHistorialModal.historial_estados || [turnoHistorialModal.estado];
        const cambios = turnoHistorialModal.cambiosEstado || turnoHistorialModal.cambios_estado || [];
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="card-surface w-full max-w-2xl rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-[#3A3A48] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#3A3A48]">
                <div className="flex items-center space-x-2 text-emerald-600">
                  <History className="w-5 h-5" />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Historial de Estados (CambioEstadoTurno) — Turno #{turnoHistorialModal.nroTurno}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setTurnoHistorialModal(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1A1A22] border border-slate-200 dark:border-[#2A2A38] text-xs grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div><strong>Cliente:</strong> {turnoHistorialModal.clienteNombre || turnoHistorialModal.cliente}</div>
                <div><strong>Patente:</strong> <span className="font-mono">{turnoHistorialModal.vehiculoDominio}</span></div>
                <div><strong>Turno:</strong> {turnoHistorialModal.fecha} {turnoHistorialModal.hora} hs</div>
                <div><strong>Estado Actual:</strong> <span className="font-bold text-emerald-600">{turnoHistorialModal.estado}</span></div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="font-bold text-slate-600 dark:text-slate-400 mr-1">Secuencia:</span>
                {historial.map((h, i) => (
                  <React.Fragment key={`${h}-${i}`}>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      {h}
                    </span>
                    {i < historial.length - 1 && <span className="text-slate-400 font-bold">➔</span>}
                  </React.Fragment>
                ))}
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-[#3A3A48]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-[#1A1A22] text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-[#3A3A48]">
                    <tr>
                      <th className="px-3 py-2">#</th>
                      <th className="px-3 py-2">Estado</th>
                      <th className="px-3 py-2">Fecha y Hora Inicio</th>
                      <th className="px-3 py-2">Fecha y Hora Fin</th>
                      <th className="px-3 py-2">Observación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-[#2A2A38]">
                    {cambios.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-4 text-center text-slate-500">
                          Sin transiciones registradas
                        </td>
                      </tr>
                    ) : (
                      cambios.map((c, idx) => {
                        const fIni = c.fechaInicio || c.fecha_inicio || '-';
                        const hIni = c.horaInicio || c.hora_inicio || '';
                        const fFin = c.fechaFin ?? c.fecha_fin ?? null;
                        const hFin = c.horaFin ?? c.hora_fin ?? null;
                        const vigente = fFin === null;
                        return (
                          <tr key={c.id || idx} className={vigente ? 'bg-emerald-50/40 dark:bg-emerald-950/15' : ''}>
                            <td className="px-3 py-2 font-mono text-slate-400">{idx + 1}</td>
                            <td className="px-3 py-2 font-bold text-slate-900 dark:text-white">{c.estado}</td>
                            <td className="px-3 py-2 font-mono text-slate-700 dark:text-slate-300">
                              {fIni} {hIni ? `${hIni} hs` : ''}
                            </td>
                            <td className="px-3 py-2 font-mono">
                              {vigente ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                  Vigente (en curso)
                                </span>
                              ) : (
                                <span className="text-amber-700 dark:text-amber-300 font-bold">
                                  {fFin} {hFin ? `${hFin} hs` : ''}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-slate-500 dark:text-slate-400">
                              {c.observacion || '-'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setTurnoHistorialModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
};

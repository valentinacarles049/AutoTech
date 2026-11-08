import React, { useState, useMemo } from 'react';
import { ShieldCheck, Check, X, AlertCircle, FileCheck, CheckCircle2, ListFilter, Calendar, ArrowUpDown, RotateCcw } from 'lucide-react';
import { useWorkshop } from '../context/WorkshopContext';

export const SupervisionScreen: React.FC = () => {
  const { workOrders, approveOrder, rejectOrder, turnos, sucursales, consultarTurnos } = useWorkshop();
  const [feedback, setFeedback] = useState<string | null>(null);

  const [filtroEstado, setFiltroEstado] = useState<string>('Confirmado');
  const [filtroSucursal, setFiltroSucursal] = useState<string>('Centro');
  const [filtroFechaDesde, setFiltroFechaDesde] = useState<string>('2026-11-15');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState<string>('2026-11-16');
  const [ordenDireccion, setOrdenDireccion] = useState<'asc' | 'desc'>('asc');

  const resultadoTurnosTaller = useMemo(() => {
    return consultarTurnos({
      estado: filtroEstado,
      sucursal: filtroSucursal,
      fechaDesde: filtroFechaDesde,
      fechaHasta: filtroFechaHasta,
      ordenarPorFechaHora: true,
      ordenDireccion
    });
  }, [consultarTurnos, filtroEstado, filtroSucursal, filtroFechaDesde, filtroFechaHasta, ordenDireccion, turnos]);

  const handleApprove = (id: string, otNumber: string) => {
    approveOrder(id);
    setFeedback(`Orden ${otNumber} APROBADA con certificación de Control de Salida.`);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleReject = (id: string, otNumber: string) => {
    rejectOrder(id);
    setFeedback(`Orden ${otNumber} RECHAZADA. Se envía de vuelta a línea de taller.`);
    setTimeout(() => setFeedback(null), 3500);
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Feedback */}
      {feedback && (
        <div className="p-3.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold shadow-xl flex items-center space-x-2 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#282832] border border-slate-200 dark:border-[#3A3A48] shadow-sm">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
            <span>Órdenes Pendientes de Revisión (Control de Salida)</span>
            <span className="badge-green text-[10px]">● Supervisor: Carlos Méndez</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Validación final de torques, escaneo de fallas OBD2 y prueba en ruta bajo norma ISO 9001
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="badge-yellow">● {workOrders.filter(o => o.status !== 'Aprobado').length} Pendientes</span>
          <span className="badge-green">● {workOrders.filter(o => o.status === 'Aprobado').length} Aprobadas</span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* TABLA DE CONTROL DE CALIDAD CON BOTONES RÁPIDOS VERDES Y ROJOS */}
      {/* ============================================================ */}
      <div className="card-surface rounded-2xl shadow-sm overflow-hidden border border-slate-200 dark:border-[#3A3A48]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#1A1A22] text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] border-b border-slate-200 dark:border-[#3A3A48]">
              <tr>
                <th className="px-4 py-3.5">N° Orden & Fecha</th>
                <th className="px-4 py-3.5">Vehículo & Patente</th>
                <th className="px-4 py-3.5">Mecánico Asignado</th>
                <th className="px-4 py-3.5">Trabajo Realizado</th>
                <th className="px-4 py-3.5 text-center">Checklist Calidad</th>
                <th className="px-4 py-3.5 text-center">Estado</th>
                <th className="px-4 py-3.5 text-center w-44">Acción Rápida</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-[#3A3A48]">
              {workOrders.map((ot) => (
                <tr key={ot.id} className="hover:bg-slate-50/80 dark:hover:bg-[#202028] transition-colors">
                  
                  {/* OT Number */}
                  <td className="px-4 py-3.5">
                    <span className="font-mono font-bold text-slate-900 dark:text-white block">
                      {ot.otNumber}
                    </span>
                    <span className="text-[10px] text-slate-400">Hoy • 11:30 hs</span>
                  </td>

                  {/* Vehículo */}
                  <td className="px-4 py-3.5">
                    <p className="font-bold text-slate-900 dark:text-white">{ot.vehicleModel}</p>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px] font-bold text-red-600">
                      {ot.vehiclePlate}
                    </span>
                  </td>

                  {/* Mecánico */}
                  <td className="px-4 py-3.5 font-medium text-slate-700 dark:text-slate-300">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-[10px]">
                        {ot.technicianName.charAt(0)}
                      </div>
                      <span>{ot.technicianName}</span>
                    </div>
                  </td>

                  {/* Trabajo Realizado */}
                  <td className="px-4 py-3.5 max-w-xs text-slate-600 dark:text-slate-300">
                    <p className="truncate" title={ot.mainTask}>{ot.mainTask}</p>
                    <span className="text-[10px] font-mono text-slate-400">Horas: {ot.hoursWorked} hs</span>
                  </td>

                  {/* Checklist */}
                  <td className="px-4 py-3.5 text-center">
                    <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>{ot.qualityChecklist?.passedItems || 8}/{ot.qualityChecklist?.totalItems || 8} Ítems</span>
                    </div>
                  </td>

                  {/* Estado */}
                  <td className="px-4 py-3.5 text-center">
                    <span className={ot.status === 'Aprobado' ? 'badge-green' : 'badge-yellow'}>
                      {ot.status}
                    </span>
                  </td>

                  {/* ACCIONES RÁPIDAS EXIGIDAS: APROBAR (VERDE) Y RECHAZAR (ROJO) */}
                  <td className="px-4 py-3.5 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      {/* Botón Verde: Aprobar */}
                      <button
                        onClick={() => handleApprove(ot.id, ot.otNumber)}
                        title="Aprobar para entrega al cliente"
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1 transition-all active:scale-95 ${
                          ot.status === 'Aprobado'
                            ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400'
                            : 'bg-emerald-600/10 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-500/30'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Aprobar</span>
                      </button>

                      {/* Botón Rojo: Rechazar */}
                      <button
                        onClick={() => handleReject(ot.id, ot.otNumber)}
                        title="Rechazar y devolver a taller"
                        className={`px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1 transition-all active:scale-95 ${
                          ot.status === 'Pendiente'
                            ? 'bg-red-600/10 text-red-600 border border-red-500/30 hover:bg-red-600 hover:text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-600'
                        }`}
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Rechazar</span>
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================ */}
      {/* HU-12: CONSULTAR TURNOS POR ESTADO, FECHA Y SUCURSAL (RESPONSABLE DE TALLER) */}
      {/* ============================================================ */}
      <div className="card-surface rounded-2xl p-5 shadow-sm space-y-4 border border-slate-200 dark:border-[#3A3A48]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-[#3A3A48]">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <ListFilter className="w-4 h-4 text-red-600" />
              <span>HU-12: Agenda de Turnos del Taller por Estado, Fecha y Sucursal</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Organice la atención diaria filtrando por estado, rango de fechas y sucursal, ordenado por fecha y hora.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setFiltroEstado('Confirmado');
                setFiltroFechaDesde('2026-11-15');
                setFiltroFechaHasta('2026-11-16');
                setFiltroSucursal('Centro');
                setOrdenDireccion('asc');
              }}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 transition-colors"
            >
              ⚡ Confirmados (15/11 al 16/11)
            </button>
            <button
              type="button"
              onClick={() => {
                setFiltroEstado('Cancelado');
                setFiltroFechaDesde('2026-11-15');
                setFiltroFechaHasta('2026-11-16');
                setFiltroSucursal('Centro');
              }}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 transition-colors"
            >
              ⚡ Cancelados (Sin resultados)
            </button>
            <button
              type="button"
              onClick={() => {
                setFiltroEstado('Todos');
                setFiltroFechaDesde('');
                setFiltroFechaHasta('');
                setFiltroSucursal('Todas');
                setOrdenDireccion('asc');
              }}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center space-x-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Todos</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Estado</label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="app-input w-full px-3 py-2 text-xs font-bold cursor-pointer"
            >
              <option value="Todos">Todos</option>
              <option value="Confirmado">Confirmado</option>
              <option value="Solicitado">Solicitado</option>
              <option value="Finalizado">Finalizado</option>
              <option value="Ausente">Ausente</option>
              <option value="En Taller">En Taller</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Fecha Desde</label>
            <input
              type="date"
              value={filtroFechaDesde}
              onChange={(e) => setFiltroFechaDesde(e.target.value)}
              className="app-input w-full px-3 py-2 text-xs font-mono font-bold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Fecha Hasta</label>
            <input
              type="date"
              value={filtroFechaHasta}
              onChange={(e) => setFiltroFechaHasta(e.target.value)}
              className="app-input w-full px-3 py-2 text-xs font-mono font-bold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Sucursal</label>
            <select
              value={filtroSucursal}
              onChange={(e) => setFiltroSucursal(e.target.value)}
              className="app-input w-full px-3 py-2 text-xs font-bold cursor-pointer"
            >
              <option value="Todas">Todas</option>
              {sucursales.map(s => (
                <option key={s.id} value={s.nombre}>{s.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Orden por Fecha y Hora</label>
            <button
              type="button"
              onClick={() => setOrdenDireccion(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-[#3A3A48] bg-slate-50 dark:bg-[#1A1A22] hover:bg-slate-100 text-xs font-bold flex items-center justify-between"
            >
              <span className="flex items-center space-x-1.5">
                <ArrowUpDown className="w-3.5 h-3.5 text-red-600" />
                <span>{ordenDireccion === 'asc' ? 'Ascendente' : 'Descendente'}</span>
              </span>
              <span className="text-[10px] font-mono text-red-600 font-black">
                {ordenDireccion === 'asc' ? '09:00 → 11:00' : '11:00 → 09:00'}
              </span>
            </button>
          </div>
        </div>

        {resultadoTurnosTaller.total === 0 ? (
          <div className="py-8 px-4 text-center space-y-2 rounded-xl border border-amber-500/30 bg-amber-500/10">
            <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 mx-auto" />
            <p className="text-xs sm:text-sm font-black text-amber-900 dark:text-amber-200">
              No se encontraron turnos para los filtros seleccionados
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
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Hora</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-[#3A3A48]">
                {resultadoTurnosTaller.turnos.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-[#202028]">
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{t.clienteNombre || t.cliente}</td>
                    <td className="px-4 py-3 font-mono font-bold text-red-600">{t.vehiculoDominio || t.patente}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{t.motivoConsulta || t.motivo}</td>
                    <td className="px-4 py-3">{t.sucursal}</td>
                    <td className="px-4 py-3 font-mono font-bold">{t.fecha}</td>
                    <td className="px-4 py-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">{t.hora}</td>
                    <td className="px-4 py-3">
                      <span className={t.estado === 'Confirmado' ? 'badge-green' : t.estado === 'Cancelado' ? 'badge-gray' : 'badge-yellow'}>
                        {t.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

# language: es
Característica: Confirmar turno
  Como cliente
  quiero confirmar mi turno por mail o mensaje
  para asegurar mi lugar en la sucursal

  Antecedentes:
    Dado que existe el turno de "Juan Pérez" para el vehículo "AB123CD" en la sucursal "Centro"
    Y el turno está en estado "Solicitado"

  Escenario: Confirmación dentro del plazo
    Dado que la fecha y hora actual es "13/11/2026 10:00"
    Cuando el cliente confirma el turno por "Mail"
    Entonces el turno pasa al estado "Confirmado"
    Y se cierra el CambioEstadoTurno "Solicitado" con fecha fin "13/11/2026" y hora fin "10:00"
    Y se registra el nuevo CambioEstadoTurno "Confirmado" con fecha inicio "13/11/2026", hora inicio "10:00" y sin fecha fin
    Y se registra la confirmación con la fecha "13/11/2026", la hora "10:00" y el medio "Mail"
    Y se notifica al cliente la fecha y hora del turno

  Escenario: Confirmación fuera de plazo
    Dado que la fecha y hora actual es "14/11/2026 10:00"
    Cuando el cliente confirma el turno por "Mail"
    Entonces el sistema muestra el mensaje "El plazo de confirmación venció"
    Y el turno sigue en estado "Solicitado"
    Y el CambioEstadoTurno "Solicitado" permanece vigente sin fecha ni hora de fin
    Y no se registra la confirmación

  Escenario: Confirmación de turno #1003 faltando 25 horas registra CambioEstadoTurno e historial (AUT-T3 CP-EST-01 Paso 6)
    Dado que existe el turno #1003 para el vehículo "AB123CD" el "16/11/2026" a las "10:00" en estado "Solicitado"
    Y la fecha y hora actual es "15/11/2026 09:00"
    Cuando se confirma el turno #1003 por "Mail"
    Entonces el turno queda en estado "Confirmado"
    Y el CambioEstadoTurno "Solicitado" queda cerrado con fecha fin "15/11/2026" y hora fin "09:00"
    Y se crea el CambioEstadoTurno "Confirmado" con fecha inicio "15/11/2026", hora inicio "09:00" y fecha fin nula
    Y el historial de estados del turno no es nulo y contiene ["Solicitado", "Confirmado"]

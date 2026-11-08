# language: es
Característica: Modificar turno
  Como responsable de recepción
  quiero cambiar la fecha u horario de un turno
  para adaptarlo a la disponibilidad del cliente

  Antecedentes:
    Dado que inicié sesión con el rol "Responsable de Recepción"
    Y existe el turno de "Juan Pérez" para el vehículo "AB123CD" en la sucursal "Centro" el "15/11/2026" a las "09:00" en estado "Confirmado"

  Escenario: Cambio de un turno confirmado a un horario disponible
    Dado que el horario "10:00" del "16/11/2026" en la sucursal "Centro" está disponible
    Cuando selecciono el turno de "Juan Pérez" del "15/11/2026" a las "09:00"
    Y elijo la fecha "16/11/2026" y el horario "10:00"
    Y presiono "Guardar cambios"
    Entonces el turno queda para el "16/11/2026" a las "10:00"
    Y el historial de estados del turno registra "Reprogramado" y después "Confirmado"
    Y el horario "09:00" del "15/11/2026" vuelve a estar disponible

  Escenario: Nuevo horario ocupado
    Dado que el horario "10:00" del "16/11/2026" en la sucursal "Centro" ya está ocupado
    Cuando selecciono el turno de "Juan Pérez" del "15/11/2026" a las "09:00"
    Y elijo la fecha "16/11/2026" y el horario "10:00"
    Y presiono "Guardar cambios"
    Entonces el sistema muestra el mensaje "El horario seleccionado no está disponible. Seleccione otro horario"
    Y el turno sigue el "15/11/2026" a las "09:00" en estado "Confirmado"

  Escenario: Sólo se modifican turnos Solicitados o Confirmados (no cancelados ni finalizados)
    Dado que existe un turno en estado "Cancelado"
    Cuando intento modificar la fecha u horario del turno cancelado
    Entonces el sistema rechaza la modificación indicando "Sólo se modifican turnos Solicitados o Confirmados"
    Y el turno permanece en estado "Cancelado"

  Escenario: Modificación de un turno en estado Solicitado
    Dado que existe un turno en estado "Solicitado" para el vehículo "CD456EF"
    Cuando elijo una nueva fecha "17/11/2026" y horario "11:00" disponible
    Y presiono "Guardar cambios"
    Entonces el turno queda para el "17/11/2026" a las "11:00"
    Y el estado final del turno es "Solicitado"
    Y el historial de estados registra "Reprogramado" y después "Solicitado"

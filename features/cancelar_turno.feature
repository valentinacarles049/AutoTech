# language: es
Característica: Cancelar turno
  Como cliente o responsable de recepción
  quiero cancelar un turno indicando el motivo
  para liberar el horario

  Antecedentes:
    Dado que inicié sesión con el rol "Responsable de Recepción"
    Y existe el turno de "Juan Pérez" para el vehículo "AB123CD" en la sucursal "Centro" el "15/11/2026" a las "09:00"

  Escenario: Cancelación exitosa con motivo
    Cuando selecciono el turno de "Juan Pérez" del "15/11/2026" a las "09:00"
    Y ingreso el motivo "El cliente no puede asistir"
    Y presiono "Cancelar turno"
    Entonces el turno pasa al estado "Cancelado"
    Y se registra el motivo "El cliente no puede asistir"
    Y el horario "09:00" del "15/11/2026" en la sucursal "Centro" vuelve a estar disponible

  Escenario: Cancelación sin motivo
    Cuando selecciono el turno de "Juan Pérez" del "15/11/2026" a las "09:00"
    Y dejo el motivo vacío
    Y presiono "Cancelar turno"
    Entonces el sistema muestra el mensaje "El motivo de cancelación es obligatorio"
    Y el turno sigue en estado "Solicitado"

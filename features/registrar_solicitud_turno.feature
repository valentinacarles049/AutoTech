# language: es
Característica: Registrar solicitud de turno
  Como responsable de recepción
  quiero registrar la solicitud de turno de un cliente para su vehículo
  para que se presente en la sucursal y se genere el presupuesto de la reparación

  Antecedentes:
    Dado que inicié sesión con el rol "Responsable de Recepción"
    Y existe el cliente "Juan Pérez" con DNI "30123456" y el vehículo con patente "AB123CD"
    Y la sucursal "Centro" atiende el "15/11/2026" de 08:00 a 17:00

  Escenario: Registro exitoso de un turno en un horario disponible
    Dado que el horario "09:00" del "15/11/2026" en la sucursal "Centro" está disponible
    Cuando busco al cliente por DNI "30123456"
    Y selecciono el vehículo "AB123CD"
    Y ingreso el motivo de consulta "Mantenimiento general"
    Y selecciono la sucursal "Centro", la fecha "15/11/2026" y el horario "09:00"
    Y presiono "Registrar turno"
    Entonces el sistema registra el turno con un número de turno
    Y el turno queda en estado "Solicitado"
    Y el horario "09:00" del "15/11/2026" deja de estar disponible

  Escenario: Horario sin disponibilidad
    Dado que el horario "09:00" del "15/11/2026" en la sucursal "Centro" ya está ocupado
    Cuando busco al cliente por DNI "30123456"
    Y selecciono el vehículo "AB123CD"
    Y selecciono la sucursal "Centro", la fecha "15/11/2026" y el horario "09:00"
    Y presiono "Registrar turno"
    Entonces el sistema muestra el mensaje "El horario seleccionado no está disponible. Seleccione otro horario"
    Y no se registra el turno

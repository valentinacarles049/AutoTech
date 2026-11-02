# language: es
Característica: Consultar disponibilidad horaria
  Como responsable de recepción
  quiero ver los horarios libres de una sucursal para una fecha
  para ofrecerle al cliente un turno posible

  Antecedentes:
    Dado que inicié sesión con el rol "Responsable de Recepción"
    Y la sucursal "Centro" atiende de 08:00 a 17:00

  Escenario: Muestra horarios dentro del horario de atención de la sucursal
    Cuando consulto la disponibilidad horaria para la sucursal "Centro" en la fecha "15/11/2026"
    Entonces los horarios consultados se encuentran comprendidos entre las "08:00" y las "17:00"

  Escenario: Excluye los horarios con turnos Solicitados o Confirmados
    Dado que existe un turno en estado "Solicitado" a las "09:00" del "15/11/2026" en la sucursal "Centro"
    Y existe un turno en estado "Confirmado" a las "11:00" del "15/11/2026" en la sucursal "Centro"
    Y existe un turno en estado "Cancelado" a las "14:00" del "15/11/2026" en la sucursal "Centro"
    Cuando consulto los horarios libres para la sucursal "Centro" en la fecha "15/11/2026"
    Entonces los horarios "09:00" y "11:00" quedan excluidos de los horarios libres
    Y el horario "14:00" se encuentra disponible entre los horarios libres

  Escenario: Sin horarios libres en la fecha seleccionada
    Dado que todos los horarios de la sucursal "Centro" están ocupados con turnos Solicitados o Confirmados para la fecha "16/11/2026"
    Cuando consulto la disponibilidad horaria para la sucursal "Centro" en la fecha "16/11/2026"
    Entonces el sistema muestra el mensaje "Sin disponibilidad para la fecha seleccionada"
    Y la lista de horarios libres está vacía

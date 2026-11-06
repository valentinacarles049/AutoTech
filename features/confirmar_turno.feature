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
    Y se registra la confirmación con la fecha "13/11/2026", la hora "10:00" y el medio "Mail"
    Y se notifica al cliente la fecha y hora del turno

  Escenario: Confirmación fuera de plazo
    Dado que la fecha y hora actual es "14/11/2026 10:00"
    Cuando el cliente confirma el turno por "Mail"
    Entonces el sistema muestra el mensaje "El plazo de confirmación venció"
    Y el turno sigue en estado "Solicitado"
    Y no se registra la confirmación

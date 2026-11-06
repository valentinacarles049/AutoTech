# language: es
Característica: Modificar vehículo
  Como responsable de atención al cliente
  quiero modificar los datos de un vehículo
  para corregir errores o actualizar el kilometraje

  Antecedentes:
    Dado que inicié sesión con el rol "Responsable de Atención al Cliente"
    Y existe el vehículo con patente "AB123CD" del cliente "Juan Pérez" con 45000 km registrados

  Escenario: Actualización exitosa del kilometraje
    Cuando busco el vehículo con patente "AB123CD"
    Y cambio el kilometraje a 52000
    Y presiono "Guardar"
    Entonces el sistema muestra el mensaje "Vehículo modificado correctamente"
    Y el vehículo "AB123CD" queda con 52000 km

  Escenario: Kilometraje menor al registrado
    Cuando busco el vehículo con patente "AB123CD"
    Y cambio el kilometraje a 40000
    Y presiono "Guardar"
    Entonces el sistema muestra el mensaje "El kilometraje no puede ser menor al registrado"
    Y el vehículo "AB123CD" sigue con 45000 km

  Escenario: La patente modificada no puede repetirse
    Dado que existe el vehículo con patente "AF-123-ZZ"
    Cuando busco el vehículo con patente "AB123CD"
    Y cambio la patente a "AF-123-ZZ"
    Y presiono "Guardar"
    Entonces el sistema muestra el mensaje "Ya existe un vehículo con esa patente en el sistema"
    Y el vehículo conserva la patente "AB123CD"

  Escenario: Actualización de datos para corregir errores
    Cuando busco el vehículo con patente "AB123CD"
    Y cambio el modelo a "Corolla 2.0 SEG Hybrid" y el año a 2023
    Y presiono "Guardar"
    Entonces el sistema muestra el mensaje "Vehículo modificado correctamente"
    Y el vehículo "AB123CD" queda actualizado con el nuevo modelo y año

  Escenario: Control de acceso por rol (HU-03 RBAC)
    Dado que un usuario sin rol de atención al cliente intenta modificar un vehículo
    Entonces el sistema deniega el acceso con código 403 Forbidden

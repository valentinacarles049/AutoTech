# language: es
Característica: Modificar cliente
  Como responsable de atención al cliente
  quiero modificar los datos de un cliente
  para mantener actualizada su información de contacto

  Antecedentes:
    Dado que inicié sesión con el rol "Responsable de Atención al Cliente"
    Y existe el cliente "Juan Pérez" con tipo de documento "DNI" y número "30123456"

  Escenario: Modificación exitosa de los datos de contacto
    Cuando busco al cliente por DNI "30123456"
    Y cambio el mail a "jperez@example.com" y el teléfono a "3515001122"
    Y presiono "Guardar"
    Entonces el sistema muestra el mensaje "Cliente modificado correctamente"
    Y el cliente "Juan Pérez" queda con el mail "jperez@example.com" y el teléfono "3515001122"

  Escenario: Documento que ya pertenece a otro cliente
    Dado que existe el cliente "María Gómez" con tipo de documento "DNI" y número "28999888"
    Cuando busco al cliente por DNI "30123456"
    Y cambio el número de documento a "28999888"
    Y presiono "Guardar"
    Entonces el sistema muestra el mensaje "Ya existe un cliente con ese tipo y número de documento"
    Y el cliente "Juan Pérez" conserva el DNI "30123456"

  Escenario: Validación de campos obligatorios requeridos al modificar
    Cuando busco al cliente por DNI "30123456"
    Y dejo el campo nombre vacío ""
    Y presiono "Guardar"
    Entonces el sistema muestra el mensaje de error "Los campos nombre, apellido, tipo y número de documento, mail y teléfono son obligatorios"
    Y no se guardan los cambios

  Escenario: Validación de formato de correo electrónico al modificar
    Cuando busco al cliente por DNI "30123456"
    Y cambio el mail a "correo-invalido-sin-arroba"
    Y presiono "Guardar"
    Entonces el sistema muestra el mensaje de error "El mail debe tener formato válido"
    Y no se guardan los cambios

  Escenario: El cliente puede conservar su propio documento sin conflicto de unicidad
    Cuando busco al cliente por DNI "30123456"
    Y mantengo el número de documento "30123456"
    Y cambio el mail a "nuevo.mail@example.com"
    Y presiono "Guardar"
    Entonces el sistema muestra el mensaje "Cliente modificado correctamente"
    Y el cliente conserva su documento sin error de duplicidad

  Escenario: Restricción por rol de usuario (HU-03 RBAC)
    Dado que un usuario sin rol de atención intenta modificar los datos de un cliente
    Entonces el sistema deniega el acceso con código 403 Forbidden

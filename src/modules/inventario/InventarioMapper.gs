/*******************************************************
 * Mapeos entre payload, F-TIC-05 y MC-F-TIC-05.
 *******************************************************/

function mapToMasterRow_(payload) {
  const p = applyFtic05Rules_(Object.assign({}, payload || {}));
  const estadoRegistro = upperClean_(p.estado_registro || CONFIG.APP.DEFAULT_RECORD_STATUS);
  const tipoActivo = canonicalAssetType_(p.tipo_activo) || CONFIG.APP.DEFAULT_ASSET_TYPE;

  return {
    ID_ACTIVO: p.id_activo,
    FECHA_HORA_ALTA: p.fecha_hora_alta || '',
    FECHA_HORA_ULTIMA_ACTUALIZACION: p.fecha_hora_ultima_actualizacion || '',
    ESTADO_REGISTRO: estadoRegistro,
    EMPRESA_DEL_GRUPO: upperClean_(p.empresa_grupo),
    TIPO_ACTIVO: tipoActivo,
    MARCA: p.marca,
    MODELO: p.modelo,
    SERIE_SERVICE_TAG: p.serie_service_tag,
    IMEI_1: p.imei_1,
    IMEI_2: p.imei_2,
    DIRECCION_MAC: p.direccion_mac,
    NUMERO_MOVIL: p.numero_movil,
    OPERADOR: p.operador,
    PROCESADOR: p.procesador,
    MEMORIA_RAM_GB: p.memoria_ram_gb,
    ALMACENAMIENTO: p.almacenamiento,
    TIPO_ALMACENAMIENTO: p.tipo_almacenamiento,
    PANTALLA_PULGADAS: p.pantalla_pulgadas,
    SISTEMA_OPERATIVO: p.sistema_operativo,
    VERSION_SO: p.version_so,
    ANTIVIRUS: p.antivirus,
    BATERIA_MAH: p.bateria_mah,
    HOSTNAME: p.hostname,
    USUARIO_ASIGNADO: p.usuario_asignado,
    DNI_USUARIO: p.dni_usuario,
    CARGO_USUARIO: p.cargo_usuario,
    AREA_USUARIO: p.area_usuario,
    PROYECTO_SEDE: p.proyecto_sede,
    CENTRO_DE_COSTO: p.centro_de_costo,
    UBICACION_FISICA: p.ubicacion_fisica,
    ESTADO_OPERATIVO: p.estado_operativo,
    FECHA_COMPRA: p.fecha_compra,
    PROVEEDOR_COMPRA: p.proveedor_compra,
    NUMERO_FACTURA: p.numero_factura,
    COSTO_ADQUISICION_SOLES: p.costo_adquisicion_soles,
    GARANTIA_FECHA_FIN: p.garantia_fecha_fin,
    FECHA_INICIO_DEPRECIACION: p.fecha_inicio_depreciacion,
    VIDA_UTIL_MESES: p.vida_util_meses,
    OBSERVACIONES: buildMasterObservations_(p),
    APORTA_I_O_47: isSmartphone_(tipoActivo) && estadoRegistro === 'ACTIVO',
    APORTA_I_O_48: isComputer_(tipoActivo) && estadoRegistro === 'ACTIVO',
    APORTA_I_O_62: estadoRegistro === 'ACTIVO',
    LINK_ACTA_ENTREGA_F_TIC_04: p.link_acta_entrega_f_tic_04,
    LINK_CHECKLIST_F_TIC_02: p.link_checklist_f_tic_02,
    LINK_CHECKLIST_F_TIC_03: p.link_checklist_f_tic_03,
    LINK_FACTURA_COMPRA: p.link_factura_compra,
    URL_EVIDENCIA_FOTO: p.url_evidencia_foto,
    URL_EVIDENCIA_ADICIONAL: p.url_evidencia_adicional,
    DIAS_DESDE_ALTA: '',
    FLAG_OCUPABILIDAD: computeFlagOcupabilidad_(p),
    FLAG_VIDA_UTIL: computeFlagVidaUtil_(p)
  };
}

function mapToAuditorRow_(payload) {
  const p = applyFtic05Rules_(Object.assign({}, payload || {}));

  return {
    'ID DE ACTIVO': p.id_activo,
    'TIPO DE EQUIPO': p.tipo_activo,
    'MARCA': p.marca,
    'MODELO': p.modelo,
    'NÚMERO DE SERIE O IMEI': formatSerialOrImei_(p),
    'NOMBRE DEL DISPOSITIVO': p.hostname,
    'ESTADO OPERATIVO': p.estado_operativo,
    'CONDICIÓN': p.condicion,
    'UBICACIÓN': p.ubicacion_fisica || p.proyecto_sede,
    'CECO': p.centro_de_costo,
    'USUARIO ASIGNADO': p.usuario_asignado,
    'FECHA DE ENTREGA': formatFticDate_(p.fecha_entrega),
    'ACTA DE ENTREGA (F-TIC-04)': p.link_acta_entrega_f_tic_04,
    'INFORME DE MTTO. (F-TIC-11)': p.link_informe_mtto_f_tic_11,
    'SISTEMA OPERATIVO': joinNonEmpty_([p.sistema_operativo, p.version_so], ' - '),
    'PROCESADOR': p.procesador,
    'MEMORIA RAM': formatRam_(p),
    'ALMACENAMIENTO': p.almacenamiento,
    'TARJETA DE VIDEO': p.tarjeta_video,
    'DIRECCIÓN MAC': p.direccion_mac,
    'DIRECCIÓN IP': p.direccion_ip,
    'NÚMERO MÓVIL': p.numero_movil,
    'CONECTIVIDAD U OPERADOR': p.operador,
    'CARACTERÍSTICA ESPECIAL': p.caracteristica_especial,
    'SOFTWARE O CORREO': p.software_o_correo || p.antivirus,
    'FALTAN ACCESORIOS': p.faltan_accesorios,
    'OBSERVACIONES': p.observaciones
  };
}

function mapAuditorObjectToPayload_(object) {
  const obj = object || {};

  return {
    id_activo: obj['ID DE ACTIVO'],
    tipo_activo: obj['TIPO DE EQUIPO'],
    marca: obj['MARCA'],
    modelo: obj['MODELO'],
    serie_service_tag: obj['NÚMERO DE SERIE O IMEI'],
    hostname: obj['NOMBRE DEL DISPOSITIVO'],
    estado_operativo: obj['ESTADO OPERATIVO'],
    condicion: obj['CONDICIÓN'],
    ubicacion_fisica: obj['UBICACIÓN'],
    centro_de_costo: obj['CECO'],
    usuario_asignado: obj['USUARIO ASIGNADO'],
    fecha_entrega: obj['FECHA DE ENTREGA'],
    link_acta_entrega_f_tic_04: obj['ACTA DE ENTREGA (F-TIC-04)'],
    link_informe_mtto_f_tic_11: obj['INFORME DE MTTO. (F-TIC-11)'],
    sistema_operativo: obj['SISTEMA OPERATIVO'],
    procesador: obj['PROCESADOR'],
    memoria_ram_texto: obj['MEMORIA RAM'],
    almacenamiento: obj['ALMACENAMIENTO'],
    tarjeta_video: obj['TARJETA DE VIDEO'],
    direccion_mac: obj['DIRECCIÓN MAC'],
    direccion_ip: obj['DIRECCIÓN IP'],
    numero_movil: obj['NÚMERO MÓVIL'],
    operador: obj['CONECTIVIDAD U OPERADOR'],
    caracteristica_especial: obj['CARACTERÍSTICA ESPECIAL'],
    software_o_correo: obj['SOFTWARE O CORREO'],
    faltan_accesorios: obj['FALTAN ACCESORIOS'],
    observaciones: obj['OBSERVACIONES']
  };
}

function buildMasterObservations_(payload) {
  const p = payload || {};
  return clean_(p.observaciones);
}

function applyFtic05Rules_(payload) {
  const p = payload || {};

  p.tipo_activo = canonicalAssetType_(p.tipo_activo) || CONFIG.APP.DEFAULT_ASSET_TYPE;
  p.estado_registro = upperClean_(p.estado_registro || CONFIG.APP.DEFAULT_RECORD_STATUS);
  p.estado_operativo = upperClean_(p.estado_operativo || CONFIG.APP.DEFAULT_OPERATIONAL_STATUS);
  p.condicion = canonicalCondition_(p.condicion || CONFIG.APP.DEFAULT_CONDITION);

  p.empresa_grupo = upperClean_(p.empresa_grupo);
  p.marca = upperTextForFtic_(p.marca);
  p.modelo = upperTextForFtic_(p.modelo);
  p.serie_service_tag = upperTextForFtic_(p.serie_service_tag);
  p.hostname = upperTextForFtic_(p.hostname);
  p.usuario_asignado = upperTextForFtic_(p.usuario_asignado);
  p.cargo_usuario = upperTextForFtic_(p.cargo_usuario);
  p.area_usuario = upperTextForFtic_(p.area_usuario);
  p.proyecto_sede = upperTextForFtic_(p.proyecto_sede);
  p.centro_de_costo = upperTextForFtic_(p.centro_de_costo);
  p.ubicacion_fisica = upperTextForFtic_(p.ubicacion_fisica || p.proyecto_sede);
  p.procesador = upperTextForFtic_(p.procesador);
  p.memoria_ram_texto = upperTextForFtic_(p.memoria_ram_texto);
  if (!p.memoria_ram_texto && clean_(p.memoria_ram_gb)) {
    p.memoria_ram_texto = clean_(p.memoria_ram_gb) + ' GB';
  }
  p.almacenamiento = upperTextForFtic_(p.almacenamiento);
  p.tipo_almacenamiento = upperTextForFtic_(p.tipo_almacenamiento);
  p.tarjeta_video = upperTextForFtic_(p.tarjeta_video);
  p.sistema_operativo = upperTextForFtic_(p.sistema_operativo);
  p.version_so = upperTextForFtic_(p.version_so);
  p.direccion_mac = upperTextForFtic_(p.direccion_mac);
  p.direccion_ip = upperTextForFtic_(p.direccion_ip);
  p.operador = upperTextForFtic_(p.operador);
  p.caracteristica_especial = upperTextForFtic_(p.caracteristica_especial);
  p.faltan_accesorios = upperTextForFtic_(p.faltan_accesorios) || 'N/A';
  p.observaciones = upperTextForFtic_(p.observaciones) || 'N/A';
  p.software_o_correo = standardizeSoftwareOrEmail_(p.software_o_correo || p.antivirus);
  p.fecha_entrega = formatFticDate_(p.fecha_entrega);

  getFticTechnicalFieldIds_().forEach(fieldId => {
    const rule = getFticFieldRule_(fieldId, p.tipo_activo);
    const value = clean_(p[fieldId]);

    if (rule === 'na') {
      p[fieldId] = 'N/A';
      return;
    }

    if (rule === 'optional' && !value) {
      p[fieldId] = 'N/A';
    }
  });

  return p;
}

function getFticTechnicalFieldIds_() {
  return [
    'hostname',
    'sistema_operativo',
    'procesador',
    'memoria_ram_texto',
    'almacenamiento',
    'tarjeta_video',
    'direccion_mac',
    'direccion_ip',
    'numero_movil',
    'operador',
    'caracteristica_especial',
    'software_o_correo'
  ];
}

function getFticFieldRule_(fieldId, assetType) {
  const tipo = canonicalAssetType_(assetType) || CONFIG.APP.DEFAULT_ASSET_TYPE;
  const rules = {
    hostname: {
      'PC-PORTÁTIL': 'required',
      'PC-ESCRITORIO': 'required',
      SMARTPHONE: 'na',
      IMPRESORA: 'optional',
      'ESCÁNER': 'na',
      MONITOR: 'na'
    },
    sistema_operativo: {
      'PC-PORTÁTIL': 'required',
      'PC-ESCRITORIO': 'required',
      SMARTPHONE: 'required',
      IMPRESORA: 'optional',
      'ESCÁNER': 'na',
      MONITOR: 'na'
    },
    procesador: {
      'PC-PORTÁTIL': 'required',
      'PC-ESCRITORIO': 'required',
      SMARTPHONE: 'required',
      IMPRESORA: 'na',
      'ESCÁNER': 'na',
      MONITOR: 'na'
    },
    memoria_ram_texto: {
      'PC-PORTÁTIL': 'required',
      'PC-ESCRITORIO': 'required',
      SMARTPHONE: 'required',
      IMPRESORA: 'na',
      'ESCÁNER': 'na',
      MONITOR: 'na'
    },
    almacenamiento: {
      'PC-PORTÁTIL': 'required',
      'PC-ESCRITORIO': 'required',
      SMARTPHONE: 'required',
      IMPRESORA: 'na',
      'ESCÁNER': 'na',
      MONITOR: 'na'
    },
    tarjeta_video: {
      'PC-PORTÁTIL': 'required',
      'PC-ESCRITORIO': 'required',
      SMARTPHONE: 'na',
      IMPRESORA: 'na',
      'ESCÁNER': 'na',
      MONITOR: 'na'
    },
    direccion_mac: {
      'PC-PORTÁTIL': 'required',
      'PC-ESCRITORIO': 'required',
      SMARTPHONE: 'required',
      IMPRESORA: 'optional',
      'ESCÁNER': 'na',
      MONITOR: 'na'
    },
    direccion_ip: {
      'PC-PORTÁTIL': 'required',
      'PC-ESCRITORIO': 'required',
      SMARTPHONE: 'required',
      IMPRESORA: 'optional',
      'ESCÁNER': 'na',
      MONITOR: 'na'
    },
    numero_movil: {
      'PC-PORTÁTIL': 'na',
      'PC-ESCRITORIO': 'na',
      SMARTPHONE: 'required',
      IMPRESORA: 'na',
      'ESCÁNER': 'na',
      MONITOR: 'na'
    },
    operador: {
      'PC-PORTÁTIL': 'na',
      'PC-ESCRITORIO': 'na',
      SMARTPHONE: 'required',
      IMPRESORA: 'na',
      'ESCÁNER': 'na',
      MONITOR: 'na'
    },
    caracteristica_especial: {
      'PC-PORTÁTIL': 'optional',
      'PC-ESCRITORIO': 'optional',
      SMARTPHONE: 'optional',
      IMPRESORA: 'optional',
      'ESCÁNER': 'optional',
      MONITOR: 'optional'
    },
    software_o_correo: {
      'PC-PORTÁTIL': 'required',
      'PC-ESCRITORIO': 'required',
      SMARTPHONE: 'required',
      IMPRESORA: 'na',
      'ESCÁNER': 'na',
      MONITOR: 'na'
    }
  };

  return rules[fieldId] ? rules[fieldId][tipo] || 'optional' : 'optional';
}

function upperTextForFtic_(value) {
  const text = clean_(value);
  if (!text) return '';
  if (isLikelyUrl_(text) || text.indexOf('@') !== -1) return text;
  return text.toUpperCase();
}

function standardizeSoftwareOrEmail_(value) {
  const text = clean_(value);
  if (!text) return '';
  if (text.indexOf('@') !== -1 || isLikelyUrl_(text)) return text;
  return text.toUpperCase();
}

function formatSerialOrImei_(payload) {
  const p = payload || {};
  if (isSmartphone_(p.tipo_activo)) {
    return joinNonEmpty_([p.imei_1 || p.serie_service_tag, p.imei_2], ' / ');
  }

  return p.serie_service_tag || p.imei_1;
}

function canonicalCondition_(value) {
  const text = normalizeHeader_(value);
  if (text === 'NUEVO') return 'NUEVO';
  if (text === 'BUENO' || text === 'ASIGNADO' || text === 'STOCK' || text === 'STAND BY') return 'BUENO';
  if (text === 'REGULAR' || text === 'POR REGULARIZAR' || text === 'PRESTAMO') return 'REGULAR';
  if (text === 'MALO') return 'MALO';
  return CONFIG.APP.DEFAULT_CONDITION;
}

function computeFlagOcupabilidad_(payload) {
  const p = payload || {};
  const estadoRegistro = upperClean_(p.estado_registro);
  const usuario = upperClean_(p.usuario_asignado);

  if (estadoRegistro !== 'ACTIVO') return 'Amarillo';
  if (!usuario || usuario === 'STOCK' || usuario === 'STAND BY') return 'Amarillo';

  return 'Verde';
}

function computeFlagVidaUtil_(payload) {
  const p = payload || {};
  const inicio = clean_(p.fecha_inicio_depreciacion);
  const meses = Number(p.vida_util_meses || 0);

  if (!inicio || !meses) return '';

  const start = new Date(inicio);
  if (isNaN(start.getTime())) return '';

  const now = new Date();
  const consumedMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  const ratio = consumedMonths / meses;

  if (ratio < 0.5) return 'Verde';
  if (ratio <= 0.8) return 'Amarillo';
  return 'Rojo';
}

function isRecordComplete_(object) {
  const optionalHeaders = CONFIG.FTIC05_OPTIONAL_COMPLETENESS_HEADERS || [];
  return CONFIG.FTIC05_HEADERS
    .filter(header => optionalHeaders.indexOf(header) === -1)
    .every(header => clean_((object || {})[header]));
}

function validateBeforeSave_(payload) {
  const p = payload || {};
  const missing = [];
  const tipoActivo = canonicalAssetType_(p.tipo_activo);

  if (!tipoActivo || getValidAssetTypes_().indexOf(tipoActivo) === -1) {
    throw new Error('Tipo de equipo no válido. Usa solo: ' + getValidAssetTypes_().join(', ') + '.');
  }

  CONFIG.REQUIRED_FIELDS.forEach(([key, label]) => {
    if (!clean_(p[key])) missing.push(label);
  });

  if (missing.length) {
    throw new Error('Faltan campos obligatorios: ' + missing.join(', '));
  }

  if (p.dni_usuario && !/^\d{8}$/.test(clean_(p.dni_usuario))) {
    throw new Error('El DNI debe tener 8 dígitos.');
  }

  // Los documentos F-TIC pueden registrarse como código documental o como URL.
  // La copia a Drive solo aplica cuando el valor es un enlace reconocible.
}

function isSmartphone_(tipo) {
  return upperClean_(tipo).includes('SMARTPHONE');
}

function isComputer_(tipo) {
  const text = upperClean_(tipo);
  return text.includes('PC') || text.includes('LAPTOP') || text.includes('PORTÁTIL') || text.includes('PORTATIL') || text.includes('ESCRITORIO');
}

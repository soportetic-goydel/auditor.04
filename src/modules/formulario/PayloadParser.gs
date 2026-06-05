/*******************************************************
 * Parser de TXT PowerShell y normalizacion de payload.
 *******************************************************/

function parseAuditTxt(txtContent) {
  try {
    if (!txtContent || typeof txtContent !== 'string') {
      throw new Error('El contenido del TXT está vacío.');
    }

    let payload = null;

    const jsonMatch = txtContent.match(/AUDIT_PAYLOAD_JSON_B64\s*=\s*([A-Za-z0-9+/=]+)/);
    if (jsonMatch && jsonMatch[1]) {
      const jsonText = decodeBase64Utf8_(jsonMatch[1]);
      payload = normalizePayload_(JSON.parse(jsonText));
    }

    if (!payload) {
      const tsvMatch = txtContent.match(/AUDIT_PAYLOAD_TSV_B64\s*=\s*([A-Za-z0-9+/=]+)/);
      if (tsvMatch && tsvMatch[1]) {
        const tsvText = decodeBase64Utf8_(tsvMatch[1]);
        payload = normalizePayload_(tsvText.split('\t'));
      }
    }

    if (!payload) {
      throw new Error('No se encontró AUDIT_PAYLOAD_JSON_B64 ni AUDIT_PAYLOAD_TSV_B64.');
    }

    return {
      ok: true,
      payload: payload,
      preview: buildPreview_(payload),
      missing: getMissingRecommendedFields_(payload)
    };
  } catch (err) {
    return {
      ok: false,
      message: err.message || 'No se pudo procesar el TXT.'
    };
  }
}

function normalizePayload_(raw) {
  if (Array.isArray(raw)) return normalizeLegacyArray_(raw);

  const source = raw || {};
  const payload = {};

  payload.id_activo = clean_(pick_(source, ['id_activo', 'ID_ACTIVO', 'ID DE ACTIVO']));
  payload.schema_version = clean_(pick_(source, ['schema_version', 'SCHEMA_VERSION']));

  payload.empresa_grupo = clean_(pick_(source, ['empresa_grupo', 'empresa', 'EMPRESA_DEL_GRUPO']));
  payload.estado_registro = upperClean_(pick_(source, ['estado_registro', 'ESTADO_REGISTRO'])) || CONFIG.APP.DEFAULT_RECORD_STATUS;
  payload.tipo_activo = canonicalAssetType_(pick_(source, ['tipo_activo', 'TIPO_ACTIVO', 'TIPO DE EQUIPO'])) || CONFIG.APP.DEFAULT_ASSET_TYPE;

  payload.marca = clean_(pick_(source, ['marca', 'MARCA']));
  payload.modelo = clean_(pick_(source, ['modelo', 'MODELO']));
  payload.serie_service_tag = clean_(pick_(source, ['serie_service_tag', 'serie', 'serial', 'SERIE_SERVICE_TAG', 'NÚMERO DE SERIE O IMEI']));
  payload.imei_1 = clean_(pick_(source, ['imei_1', 'IMEI_1']));
  payload.imei_2 = clean_(pick_(source, ['imei_2', 'IMEI_2']));

  payload.direccion_mac = normalizeMac_(pick_(source, ['direccion_mac', 'mac', 'DIRECCION_MAC', 'DIRECCIÓN MAC']));
  payload.direccion_ip = clean_(pick_(source, ['direccion_ip', 'ip', 'DIRECCION_IP', 'DIRECCIÓN IP']));
  payload.numero_movil = clean_(pick_(source, ['numero_movil', 'NUMERO_MOVIL', 'NÚMERO MÓVIL']));
  payload.operador = clean_(pick_(source, ['operador', 'OPERADOR', 'CONECTIVIDAD U OPERADOR']));

  payload.procesador = clean_(pick_(source, ['procesador', 'cpu', 'PROCESADOR']));
  payload.memoria_ram_gb = parseRamGb_(pick_(source, ['memoria_ram_gb', 'ram_gb', 'memoria_ram', 'MEMORIA_RAM_GB', 'MEMORIA RAM']));
  payload.memoria_ram_texto = clean_(pick_(source, ['memoria_ram_texto', 'memoria_ram', 'ram', 'MEMORIA_RAM', 'MEMORIA RAM']));
  payload.almacenamiento = clean_(pick_(source, ['almacenamiento', 'disco', 'storage', 'ALMACENAMIENTO']));
  payload.tipo_almacenamiento = clean_(pick_(source, ['tipo_almacenamiento', 'TIPO_ALMACENAMIENTO'])) || inferStorageType_(payload.almacenamiento);
  payload.tarjeta_video = clean_(pick_(source, ['tarjeta_video', 'gpu', 'TARJETA_VIDEO', 'TARJETA DE VIDEO']));
  payload.pantalla_pulgadas = clean_(pick_(source, ['pantalla_pulgadas', 'PANTALLA_PULGADAS']));

  payload.sistema_operativo = clean_(pick_(source, ['sistema_operativo', 'os', 'SISTEMA_OPERATIVO', 'SISTEMA OPERATIVO']));
  payload.version_so = clean_(pick_(source, ['version_so', 'os_version', 'VERSION_SO']));
  payload.antivirus = clean_(pick_(source, ['antivirus', 'nombre_av', 'ANTIVIRUS']));
  payload.tiene_antivirus = clean_(pick_(source, ['tiene_antivirus']));
  payload.antivirus_source = clean_(pick_(source, ['antivirus_source']));
  payload.bateria_mah = clean_(pick_(source, ['bateria_mah', 'BATERIA_MAH']));

  payload.hostname = clean_(pick_(source, ['hostname', 'equipo', 'HOSTNAME', 'NOMBRE DEL DISPOSITIVO']));
  payload.usuario_windows = clean_(pick_(source, ['usuario_windows', 'usuario', 'USUARIO_WINDOWS']));
  payload.usuario_asignado = clean_(pick_(source, ['usuario_asignado', 'USUARIO_ASIGNADO', 'USUARIO ASIGNADO'])) || payload.usuario_windows;
  payload.dni_usuario = clean_(pick_(source, ['dni_usuario', 'DNI_USUARIO']));
  payload.cargo_usuario = clean_(pick_(source, ['cargo_usuario', 'CARGO_USUARIO']));
  payload.area_usuario = clean_(pick_(source, ['area_usuario', 'AREA_USUARIO']));

  payload.proyecto_sede = clean_(pick_(source, ['proyecto_sede', 'PROYECTO_SEDE']));
  payload.centro_de_costo = clean_(pick_(source, ['centro_de_costo', 'ceco', 'CENTRO_DE_COSTO', 'CECO']));
  payload.ubicacion_fisica = clean_(pick_(source, ['ubicacion_fisica', 'ubicacion', 'UBICACION_FISICA', 'UBICACIÓN']));
  payload.estado_operativo = upperClean_(pick_(source, ['estado_operativo', 'ESTADO_OPERATIVO', 'ESTADO OPERATIVO'])) || CONFIG.APP.DEFAULT_OPERATIONAL_STATUS;
  payload.condicion = upperClean_(pick_(source, ['condicion', 'CONDICION', 'CONDICIÓN'])) || CONFIG.APP.DEFAULT_CONDITION;

  payload.fecha_entrega = clean_(pick_(source, ['fecha_entrega', 'FECHA_ENTREGA', 'FECHA DE ENTREGA']));
  payload.fecha_compra = clean_(pick_(source, ['fecha_compra', 'FECHA_COMPRA']));
  payload.proveedor_compra = clean_(pick_(source, ['proveedor_compra', 'PROVEEDOR_COMPRA']));
  payload.numero_factura = clean_(pick_(source, ['numero_factura', 'NUMERO_FACTURA']));
  payload.costo_adquisicion_soles = clean_(pick_(source, ['costo_adquisicion_soles', 'COSTO_ADQUISICION_SOLES']));
  payload.garantia_fecha_fin = clean_(pick_(source, ['garantia_fecha_fin', 'GARANTIA_FECHA_FIN']));
  payload.fecha_inicio_depreciacion = clean_(pick_(source, ['fecha_inicio_depreciacion', 'FECHA_INICIO_DEPRECIACION']));
  payload.vida_util_meses = clean_(pick_(source, ['vida_util_meses', 'VIDA_UTIL_MESES']));

  payload.link_acta_entrega_f_tic_04 = clean_(pick_(source, ['link_acta_entrega_f_tic_04', 'LINK_ACTA_ENTREGA_F_TIC_04', 'ACTA DE ENTREGA (F-TIC-04)']));
  payload.link_checklist_f_tic_02 = clean_(pick_(source, ['link_checklist_f_tic_02', 'LINK_CHECKLIST_F_TIC_02']));
  payload.link_checklist_f_tic_03 = clean_(pick_(source, ['link_checklist_f_tic_03', 'LINK_CHECKLIST_F_TIC_03']));
  payload.link_factura_compra = clean_(pick_(source, ['link_factura_compra', 'LINK_FACTURA_COMPRA']));
  payload.link_informe_mtto_f_tic_11 = clean_(pick_(source, ['link_informe_mtto_f_tic_11', 'INFORME DE MTTO. (F-TIC-11)']));
  payload.url_evidencia_foto = clean_(pick_(source, ['url_evidencia_foto', 'URL_EVIDENCIA_FOTO']));
  payload.url_evidencia_adicional = clean_(pick_(source, ['url_evidencia_adicional', 'URL_EVIDENCIA_ADICIONAL']));

  payload.caracteristica_especial = clean_(pick_(source, ['caracteristica_especial', 'CARACTERÍSTICA ESPECIAL']));
  payload.software_o_correo = clean_(pick_(source, ['software_o_correo', 'SOFTWARE O CORREO'])) || payload.antivirus;
  payload.faltan_accesorios = upperClean_(pick_(source, ['faltan_accesorios', 'FALTAN ACCESORIOS']));
  payload.observaciones = clean_(pick_(source, ['observaciones', 'OBSERVACIONES']));

  payload.fecha_instalacion_windows = clean_(pick_(source, ['fecha_instalacion_windows']));
  payload.fecha_creacion_windows = clean_(pick_(source, ['fecha_creacion_windows']));
  payload.bloatware = clean_(pick_(source, ['bloatware']));
  payload.nombre_archivo = clean_(pick_(source, ['nombre_archivo']));
  payload.modo_registro = upperClean_(pick_(source, ['modo_registro', 'MODO_REGISTRO'])) || '';
  payload.audit_txt_name = clean_(pick_(source, ['audit_txt_name', 'AUDIT_TXT_NAME']));
  payload.audit_txt_content = clean_(pick_(source, ['audit_txt_content', 'AUDIT_TXT_CONTENT']));
  payload.evidence_uploads = Array.isArray(source.evidence_uploads) ? source.evidence_uploads : [];

  return payload;
}

function normalizeLegacyArray_(items) {
  const ramText = clean_(items[4]);
  const storageText = joinNonEmpty_([clean_(items[7]), clean_(items[6])], ' - ');

  return {
    serie_service_tag: clean_(items[0]),
    marca: clean_(items[1]),
    modelo: clean_(items[2]),
    procesador: clean_(items[3]),
    memoria_ram_gb: parseRamGb_(ramText),
    memoria_ram_texto: ramText,
    tarjeta_video: clean_(items[5]),
    almacenamiento: storageText,
    tipo_almacenamiento: inferStorageType_(storageText),
    direccion_mac: normalizeMac_(items[10]),
    direccion_ip: clean_(items[11]),
    hostname: clean_(items[12]),
    usuario_windows: clean_(items[13]),
    usuario_asignado: clean_(items[13]),
    sistema_operativo: clean_(items[14]),
    version_so: clean_(items[15]),
    nombre_archivo: clean_(items[16]),
    bloatware: clean_(items[17]),
    tiene_antivirus: clean_(items[18]),
    antivirus: clean_(items[19]),
    fecha_instalacion_windows: clean_(items[22]),
    fecha_creacion_windows: clean_(items[23]),
    tipo_activo: CONFIG.APP.DEFAULT_ASSET_TYPE,
    estado_registro: CONFIG.APP.DEFAULT_RECORD_STATUS,
    estado_operativo: CONFIG.APP.DEFAULT_OPERATIONAL_STATUS,
    condicion: CONFIG.APP.DEFAULT_CONDITION
  };
}

function buildPreview_(payload) {
  const p = payload || {};
  return [
    ['Serie', p.serie_service_tag],
    ['Hostname', p.hostname],
    ['Usuario Windows', p.usuario_windows],
    ['Marca / modelo', joinNonEmpty_([p.marca, p.modelo], ' ')],
    ['Procesador', p.procesador],
    ['RAM', formatRam_(p)],
    ['Almacenamiento', p.almacenamiento],
    ['GPU', p.tarjeta_video],
    ['MAC', p.direccion_mac],
    ['IP', p.direccion_ip],
    ['Sistema operativo', joinNonEmpty_([p.sistema_operativo, p.version_so], ' - ')],
    ['Antivirus', p.antivirus],
    ['Fuente antivirus', p.antivirus_source]
  ];
}

function getMissingRecommendedFields_(payload) {
  const p = payload || {};
  return CONFIG.REQUIRED_FIELDS
    .filter(([key]) => !clean_(p[key]))
    .map(([, label]) => label);
}

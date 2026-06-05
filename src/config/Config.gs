/*******************************************************
 * TIC - Inventario de Activos VS04.1
 * Configuracion centralizada.
 *******************************************************/

const CONFIG = {
  TZ: 'America/Lima',

  APP: {
    TITLE: 'INVENTARIO DE ACTIVOS DE HARDWARE VS01',
    LAST_EDIT_TRACE: '2026-05-22 11:09:25 America/Lima',
    AUDIT_SCHEMA_VERSION: 'TIC-AUDIT-V04',
    DEFAULT_ASSET_TYPE: 'PC-PORTÁTIL',
    DEFAULT_RECORD_STATUS: 'ACTIVO',
    DEFAULT_OPERATIONAL_STATUS: 'OPERATIVO',
    DEFAULT_CONDITION: 'BUENO',
    ASSET_TYPES: [
      'PC-PORTÁTIL',
      'PC-ESCRITORIO',
      'SMARTPHONE',
      'IMPRESORA',
      'ESCÁNER',
      'MONITOR'
    ]
  },

  AUDITOR: {
    SPREADSHEET_ID: '1Vlwga8YbjESPwLQM9cxmNuicpaqQ9wYFggMeqtWskXc',
    SHEET_NAME: 'F-TIC-05',
    HEADER_ROW: 8,
    FIRST_DATA_ROW: 9,
    KEY_HEADER: 'NÚMERO DE SERIE O IMEI'
  },

  MASTER: {
    SPREADSHEET_ID: '1skw73nA5tACzJLaSbUWygo2WAYwjpMgSYxaqKsYGz6c',
    SHEET_NAME: 'MC-F-TIC-05',
    HEADER_ROW: 1,
    FIRST_DATA_ROW: 2,
    KEY_HEADER: 'SERIE_SERVICE_TAG',
    LOG_SHEET_NAME: 'LOG_IMPORTACIONES'
  },

  REFERENCE_DB: {
    SPREADSHEET_ID: '123J9FsE1yJNK-YYRkwI94a9ZwurjV2Rmpyxo2xnDmqc',
    SHEETS_PERSONAL: ['TDEMSRL', 'GOYDELSAC'],
    SHEET_CECO: 'CECO',
    COMPANY_ALIASES: {
      TDEM: ['TDEM', 'TDEMSRL', 'TDEM SRL'],
      GOYDEL: ['GOYDEL', 'GOYDELSAC', 'GOYDEL SAC'],
      METRIN: ['METRIN'],
      PERSONAL: ['PERSONAL']
    }
  },

  DRIVE: {
    ROOT_FOLDER_ID: '1JG50AEsefv2nReEMVRfPxDem9Pyk9mrE',
    TXT_RECORDS_FOLDER_NAME: 'Registros'
  },

  FTIC04: {
    TEMPLATE_ID: '1eg3e5edt7BL38ws3bQIape8P4fQJ0UUAbNmUWudcOmQ',
    TEMPLATE_SPREADSHEET_ID: '1eg3e5edt7BL38ws3bQIape8P4fQJ0UUAbNmUWudcOmQ',
    OUTPUT_FOLDER_ID: '',
    OUTPUT_SUBFOLDER_NAME: 'F-TIC-04 Generados',
    DOCUMENT_NAME_PREFIX: 'F-TIC-04',
    PDF_NAME_PREFIX: 'F-TIC-04',
    PDF_ENABLED: true,
    FILE_NAME_PATTERN: '{prefix} - {id_activo} - {hostname} - {serie} - {stamp}',
    PLACEHOLDERS: {},
    SHEET_NAME: '',
    CHECK_MARK: 'X',
    DEFAULT_REASON_CELL_KEY: 'requirimiento',
    DEFAULT_JUSTIFICATION_PREFIX: 'Generado desde inventario de activos de hardware',
    STANDARD_SOFTWARE_ASSET_TYPES: ['PC-PORTÁTIL', 'PC-ESCRITORIO'],
    HARDWARE_TYPE_CELL_KEYS: {
      'PC-PORTÁTIL': 'pcportatil',
      'PC-ESCRITORIO': 'pcescritorio',
      SMARTPHONE: 'smartphone',
      IMPRESORA: 'impresora',
      'ESCÁNER': 'impresora',
      MONITOR: 'otrosh'
    },
    SOFTWARE_KEYWORDS: [
      { pattern: 'AUTOCAD', cellKey: 'autocad' },
      { pattern: 'PROJECT', cellKey: 'ms' },
      { pattern: 'GIS', cellKey: 'soft' }
    ],
    CELLS: {
      solicitante: 'B8',
      fecha: 'Q8',
      dni: 'B12',
      usuario: 'I12',
      cargo: 'Q12',
      proyecto: 'B16',
      ceco: 'Q16',
      nuevoingreso: 'B23',
      reemplazoaveria: 'F23',
      requirimiento: 'L23',
      otro: 'Q23',
      pcportatil: 'B28',
      pcescritorio: 'B30',
      smartphone: 'B32',
      impresora: 'B34',
      otrosh: 'B36',
      otroh2: 'E36',
      estandar: 'L28',
      autocad: 'L30',
      ms: 'L32',
      soft: 'L34',
      otross: 'L36',
      otross2: 'O36',
      justificacion: 'B40',
      firma: 'K48'
    },
    PDF_EXPORT_OPTIONS: {
      exportFormat: 'pdf',
      format: 'pdf',
      size: 'A4',
      portrait: 'true',
      scale: '4',
      sheetnames: 'false',
      printtitle: 'false',
      pagenumbers: 'false',
      gridlines: 'false',
      fzr: 'false'
    }
  },

  REQUIRED_FIELDS: [
    ['empresa_grupo', 'Empresa del grupo'],
    ['tipo_activo', 'Tipo de activo'],
    ['marca', 'Marca'],
    ['modelo', 'Modelo'],
    ['serie_service_tag', 'Serie / Service Tag'],
    ['usuario_asignado', 'Usuario asignado'],
    ['proyecto_sede', 'Proyecto / sede'],
    ['centro_de_costo', 'Centro de costo'],
    ['estado_operativo', 'Estado operativo']
  ],

  FTIC05_HEADERS: [
    'ID DE ACTIVO',
    'TIPO DE EQUIPO',
    'MARCA',
    'MODELO',
    'NÚMERO DE SERIE O IMEI',
    'NOMBRE DEL DISPOSITIVO',
    'ESTADO OPERATIVO',
    'CONDICIÓN',
    'UBICACIÓN',
    'CECO',
    'USUARIO ASIGNADO',
    'FECHA DE ENTREGA',
    'ACTA DE ENTREGA (F-TIC-04)',
    'INFORME DE MTTO. (F-TIC-11)',
    'SISTEMA OPERATIVO',
    'PROCESADOR',
    'MEMORIA RAM',
    'ALMACENAMIENTO',
    'TARJETA DE VIDEO',
    'DIRECCIÓN MAC',
    'DIRECCIÓN IP',
    'NÚMERO MÓVIL',
    'CONECTIVIDAD U OPERADOR',
    'CARACTERÍSTICA ESPECIAL',
    'SOFTWARE O CORREO',
    'FALTAN ACCESORIOS',
    'OBSERVACIONES'
  ],

  FTIC05_OPTIONAL_COMPLETENESS_HEADERS: [
    'FECHA DE ENTREGA',
    'ACTA DE ENTREGA (F-TIC-04)',
    'INFORME DE MTTO. (F-TIC-11)'
  ],

  EVIDENCE_FIELDS: [
    ['link_acta_entrega_f_tic_04', 'ACTA_ENTREGA_F_TIC_04'],
    ['link_checklist_f_tic_02', 'CHECKLIST_F_TIC_02'],
    ['link_checklist_f_tic_03', 'CHECKLIST_F_TIC_03'],
    ['link_factura_compra', 'FACTURA_COMPRA'],
    ['link_informe_mtto_f_tic_11', 'INFORME_MTTO_F_TIC_11'],
    ['url_evidencia_foto', 'EVIDENCIA_FOTO'],
    ['url_evidencia_adicional', 'EVIDENCIA_ADICIONAL']
  ],

  LOG_HEADERS: [
    'fecha_hora',
    'usuario_ejecucion',
    'accion',
    'id_activo',
    'serie_service_tag',
    'hostname',
    'resultado',
    'mensaje',
    'carpeta_documental',
    'url_documento',
    'url_pdf'
  ]
};

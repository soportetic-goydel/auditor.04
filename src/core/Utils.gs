/*******************************************************
 * Utilidades generales.
 *******************************************************/

function clean_(value) {
  if (value === null || value === undefined) return '';
  const text = String(value).replace(/\r?\n/g, ' ').trim();
  if (!text) return '';

  const lowered = text.toLowerCase();
  if (text === '-' || lowered === 'null' || lowered === 'undefined' || lowered === 'nan') return '';

  return text;
}

function upperClean_(value) {
  return clean_(value).toUpperCase();
}

function isNa_(value) {
  return normalizeHeader_(value) === 'N/A' || normalizeHeader_(value) === 'NA';
}

function normalizeHeader_(header) {
  return clean_(header)
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function joinNonEmpty_(items, separator) {
  return (items || []).filter(item => clean_(item)).join(separator || ' ');
}

function decodeBase64Utf8_(base64Text) {
  const bytes = Utilities.base64Decode(clean_(base64Text));
  return Utilities.newBlob(bytes).getDataAsString('UTF-8');
}

function safeFolderName_(name) {
  const fallback = clean_(name) || 'SIN_NOMBRE';
  return fallback
    .replace(/[\\\/:*?"<>|#%{}~&]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 120);
}

function canonicalAssetType_(value) {
  const normalized = normalizeHeader_(value);
  const aliases = {
    'PC PORTATIL': 'PC-PORTÁTIL',
    'PC-PORTATIL': 'PC-PORTÁTIL',
    'PC-PORTÁTIL': 'PC-PORTÁTIL',
    'LAPTOP': 'PC-PORTÁTIL',
    'PORTATIL': 'PC-PORTÁTIL',
    'PORTÁTIL': 'PC-PORTÁTIL',
    'PC ESCRITORIO': 'PC-ESCRITORIO',
    'PC-ESCRITORIO': 'PC-ESCRITORIO',
    'DESKTOP': 'PC-ESCRITORIO',
    'SMARTPHONE': 'SMARTPHONE',
    'CELULAR': 'SMARTPHONE',
    'MOVIL': 'SMARTPHONE',
    'MÓVIL': 'SMARTPHONE',
    'IMPRESORA': 'IMPRESORA',
    'PRINTER': 'IMPRESORA',
    'ESCANER': 'ESCÁNER',
    'ESCÁNER': 'ESCÁNER',
    'SCANNER': 'ESCÁNER',
    'MONITOR': 'MONITOR'
  };

  return aliases[normalized] || '';
}

function getValidAssetTypes_() {
  return (CONFIG.APP && CONFIG.APP.ASSET_TYPES) || [];
}

function isValidAssetType_(value) {
  return getValidAssetTypes_().indexOf(canonicalAssetType_(value)) !== -1;
}

function extractDriveFileId_(url) {
  const text = clean_(url);
  if (!text) return '';

  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /\/document\/d\/([a-zA-Z0-9_-]+)/,
    /\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/,
    /\/presentation\/d\/([a-zA-Z0-9_-]+)/,
    /\/drive\/folders\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }

  return '';
}

function formatRam_(payload) {
  const p = payload || {};
  if (clean_(p.memoria_ram_texto)) return clean_(p.memoria_ram_texto);
  if (clean_(p.memoria_ram_gb)) return clean_(p.memoria_ram_gb) + ' GB';
  return '';
}

function parseRamGb_(value) {
  const text = clean_(value);
  if (!text) return '';

  const match = text.match(/(\d+(?:[.,]\d+)?)/);
  if (!match) return '';

  return Number(match[1].replace(',', '.'));
}

function inferStorageType_(storageText) {
  const text = upperClean_(storageText);
  if (!text) return '';

  if (text.includes('NVME')) return 'SSD NVME';
  if (text.includes('SSD')) return 'SSD';
  if (text.includes('HDD')) return 'HDD';
  if (text.includes('EMMC')) return 'EMMC';
  if (text.includes('UFS')) return 'UFS';

  return '';
}

function normalizeMac_(value) {
  const text = clean_(value);
  if (!text) return '';

  const hex = text.replace(/[^0-9a-fA-F]/g, '').toUpperCase();
  if (hex.length === 12) {
    return hex.match(/.{1,2}/g).join(':');
  }

  return text.replace(/-/g, ':').toUpperCase();
}

function pick_(object, keys) {
  const source = object || {};
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(source, key) && source[key] !== null && source[key] !== undefined) {
      return source[key];
    }
  }
  return '';
}

function isLikelyUrl_(value) {
  const text = clean_(value);
  if (!text) return true;
  return /^https?:\/\/\S+\.\S+/i.test(text);
}

function isEmail_(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean_(value));
}

function extractEmail_(value) {
  const match = clean_(value).match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
  return match ? match[0] : '';
}

function getActiveUserEmail_() {
  try {
    return Session.getActiveUser().getEmail() || '';
  } catch (e) {
    return '';
  }
}

function nowString_() {
  return Utilities.formatDate(new Date(), CONFIG.TZ, 'yyyy-MM-dd HH:mm:ss');
}

function formatFticDate_(value) {
  const text = clean_(value);
  if (!text) return '';
  if (isNa_(text)) return 'N/A';

  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return isoMatch[3] + '/' + isoMatch[2] + '/' + isoMatch[1];
  }

  const slashMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    return slashMatch[1].padStart(2, '0') + '/' + slashMatch[2].padStart(2, '0') + '/' + slashMatch[3];
  }

  return text;
}

function normalizeCompanyKey_(value) {
  const text = normalizeHeader_(value);
  if (!text) return '';

  const aliases = CONFIG.REFERENCE_DB.COMPANY_ALIASES || {};
  for (const key in aliases) {
    const normalizedAliases = aliases[key].map(alias => normalizeHeader_(alias));
    if (normalizedAliases.indexOf(text) !== -1) return key;
  }

  return text;
}

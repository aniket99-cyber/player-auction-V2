import multer from 'multer';
import { ApiError } from '@utils/ApiError';

const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_IMPORT_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

const ALLOWED_IMPORT_MIME_TYPES = new Set([
  'text/csv',
  'text/plain',
  'application/csv',
  'application/x-csv',
  'text/x-csv',
  'text/comma-separated-values',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/octet-stream',
]);

const ALLOWED_IMPORT_EXTENSIONS = new Set(['.csv', '.xls', '.xlsx']);

export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
      cb(ApiError.badRequest(`Unsupported image type: ${file.mimetype}. Allowed: JPEG, PNG, WEBP`));
      return;
    }
    cb(null, true);
  },
});

export const uploadImportFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMPORT_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    const ext = file.originalname ? file.originalname.slice(file.originalname.lastIndexOf('.')).toLowerCase() : '';
    if (!ALLOWED_IMPORT_MIME_TYPES.has(file.mimetype) && !ALLOWED_IMPORT_EXTENSIONS.has(ext)) {
      cb(ApiError.badRequest(`Unsupported file type: ${file.mimetype}. Allowed: CSV, XLS, XLSX`));
      return;
    }
    cb(null, true);
  },
});

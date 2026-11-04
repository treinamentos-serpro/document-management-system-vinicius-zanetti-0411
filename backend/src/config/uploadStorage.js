const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const multer = require('multer');

const storageDirectory = path.resolve(
  process.env.STORAGE_DIR || path.join(__dirname, '../../storage'),
);
const configuredLimit = Number(process.env.MAX_FILE_SIZE_BYTES);
const maxFileSize = Number.isSafeInteger(configuredLimit) && configuredLimit > 0
  ? configuredLimit
  : 10 * 1024 * 1024;

const storage = multer.diskStorage({
  destination(req, file, callback) {
    fs.mkdir(storageDirectory, { recursive: true }, (error) => {
      callback(error, storageDirectory);
    });
  },
  filename(req, file, callback) {
    callback(null, randomUUID());
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: maxFileSize,
    files: 1,
  },
});

module.exports = { storageDirectory, upload };
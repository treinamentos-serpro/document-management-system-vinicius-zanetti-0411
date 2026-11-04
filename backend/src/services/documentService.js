const fs = require('node:fs/promises');
const { randomUUID } = require('node:crypto');
const documentRepository = require('../repositories/documentRepository');

function toPublicDocument(document) {
  return {
    id: document.id,
    originalName: document.originalName,
    size: document.size,
    uploadedAt: document.uploadedAt,
    mimeType: document.mimeType,
  };
}

function createDocumentService(repository = documentRepository) {
  return {
    async createDocument(file, ownerId) {
      const document = {
        id: randomUUID(),
        ownerId,
        originalName: file.originalname,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        mimeType: file.mimetype,
        storedName: file.filename,
        storagePath: file.path,
      };

      try {
        repository.create(document);
      } catch (error) {
        await fs.rm(file.path, { force: true }).catch(() => {});
        throw error;
      }

      return toPublicDocument(document);
    },

    async discardUpload(filePath) {
      await fs.rm(filePath, { force: true });
    },

    listDocuments(ownerId) {
      return repository.findAllByOwner(ownerId).map(toPublicDocument);
    },

    findDocumentForDownload(id, ownerId) {
      return repository.findByIdAndOwner(id, ownerId);
    },
  };
}

module.exports = createDocumentService();
module.exports.createDocumentService = createDocumentService;
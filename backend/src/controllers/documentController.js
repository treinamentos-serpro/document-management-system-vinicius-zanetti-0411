const documentService = require('../services/documentService');

const LOCAL_OWNER_ID = 'local-user';

function createDocumentController(service = documentService) {
  function getOwnerId(req) {
    return req.user?.id || LOCAL_OWNER_ID;
  }

  return {
    async upload(req, res, next) {
      if (!req.file) {
        return res.status(400).json({
          error: { code: 'FILE_REQUIRED', message: 'Envie um arquivo no campo "file".' },
        });
      }

      if (req.file.size === 0) {
        try {
          await service.discardUpload(req.file.path);
        } catch (error) {
          return next(error);
        }

        return res.status(400).json({
          error: { code: 'FILE_EMPTY', message: 'O arquivo enviado está vazio.' },
        });
      }

      try {
        const document = await service.createDocument(req.file, getOwnerId(req));
        return res.status(201).json({ document });
      } catch (error) {
        return next(error);
      }
    },

    list(req, res, next) {
      try {
        return res.json({ documents: service.listDocuments(getOwnerId(req)) });
      } catch (error) {
        return next(error);
      }
    },

    download(req, res, next) {
      try {
        const document = service.findDocumentForDownload(req.params.id, getOwnerId(req));
        if (!document) {
          return res.status(404).json({
            error: { code: 'DOCUMENT_NOT_FOUND', message: 'Documento não encontrado.' },
          });
        }

        res.set('X-Content-Type-Options', 'nosniff');
        return res.download(document.storagePath, document.originalName, (error) => {
          if (!error) {
            return;
          }

          if (res.headersSent) {
            return next(error);
          }

          if (error.code === 'ENOENT') {
            return res.status(404).json({
              error: { code: 'DOCUMENT_NOT_FOUND', message: 'Documento não encontrado.' },
            });
          }

          return next(error);
        });
      } catch (error) {
        return next(error);
      }
    },
  };
}

module.exports = createDocumentController();
module.exports.createDocumentController = createDocumentController;
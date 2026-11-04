const express = require('express');
const { upload } = require('../config/uploadStorage');
const documentController = require('../controllers/documentController');

const router = express.Router();

router.post('/upload', upload.single('file'), documentController.upload);
router.get('/documents', documentController.list);
router.get('/documents/:id/download', documentController.download);

module.exports = router;
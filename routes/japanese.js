const express = require('express');
const router = express.Router();
const japanese = require('../controllers/japanese');

router.post('/all', japanese.downloadAllAudio);
router.get('/:word', japanese.downloadAudio);
router.get('/translate/:word', japanese.getTranslation);
router.delete('/', japanese.deleteAllAudios);

module.exports = router;
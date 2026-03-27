const express = require('express')
const router  = express.Router()
const { protect } = require('../middleware/authMiddleware')
const { generate } = require('../controllers/learnController')
 
// Single route — generates lesson + questions in one AI call
router.post('/generate', protect, generate)
 
module.exports = router
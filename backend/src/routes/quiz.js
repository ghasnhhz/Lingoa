const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/authMiddleware')
const { generate, submit, getResult, getHistory, saveLearnResult } = require('../controllers/quizController')
 
// Protected routes
router.post('/generate',          protect, generate)
router.post('/:quizId/submit',    protect, submit)
router.get('/history',            protect, getHistory)
router.post('/save-learn-result',  protect, saveLearnResult)
 
// Public route (shareable result link)
router.get('/:resultId',  getResult)
 
module.exports = router
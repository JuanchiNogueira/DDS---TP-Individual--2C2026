import express from 'express';

const router = express.Router();

router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    data: { ok: true }
  });
});

export default router;

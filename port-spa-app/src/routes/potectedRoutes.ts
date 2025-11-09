import express, {type Request } from 'express';
import { authenticate } from '../middlewares/authMiddleware';

interface AuthenticatedRequest extends Request {
    user?: {
        email?: string;
        [key: string]: any;
    };
}

const router = express.Router();

router.use(authenticate);

router.get('/secure-data', (req: AuthenticatedRequest, res) => {
    const email = req.user?.email ?? 'utilizador';
    res.send(`Hello ${email}, here is your secure data.`);
});

export default router;
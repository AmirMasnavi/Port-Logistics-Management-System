// typescript
import express from 'express';
import admin from 'firebase-admin';
import protectedRoutes from './routes/potectedRoutes'; 

const app = express();

app.use(express.json());
app.use('/api', protectedRoutes);

admin.initializeApp({
    credential: admin.credential.applicationDefault(),
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

export default app;
import express from 'express';
import logger from '#config/logger.js';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from '#routes/auth.routes.js';
import securityMiddleware from '#middleware/security.middleware.js';
import { healthCheck } from '#config/database.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());

app.use(morgan('combined',{stream: { write: (message)=>logger.info(message.trim())}}));

app.use(securityMiddleware)

app.get('/', (req, res) => {
  logger.info('Hello from Acquisitions!');
  res.status(200).send('Hello from Acquisitions!');
});

app.get('/health', async (req,res)=>{
  try {
    const dbHealth = await healthCheck();
    const isHealthy = dbHealth.status === 'healthy';
    
    const healthStatus = {
      status: isHealthy ? 'OK' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'unknown',
      database: dbHealth
    };
    
    res.status(isHealthy ? 200 : 503).json(healthStatus);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'unknown',
      error: 'Health check failed'
    });
  }
});

app.get('/api',(req,res)=>{
  res.status(200).json({message:'Acuisitions api is running!'});
});

app.use('/api/auth',authRoutes);

export default app;

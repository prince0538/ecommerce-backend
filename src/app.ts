import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';
import categoryRoute from './routes/category.route';
import userRoute from './routes/auth.route';
import productRoute from './routes/product.route';
import cartRoute from './routes/cart.route';
import orderRoute from './routes/order.route';

const app = express();


app.use(helmet());
app.use(cors());
app.use(cookieParser());
app.use(morgan('dev'));
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/v1/category', categoryRoute)
app.use('/api/v1/user', userRoute)
app.use('/api/v1/product', productRoute)
app.use('/api/v1/cart', cartRoute)
app.use('/api/v1/order', orderRoute)

app.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok' 
  });
});

export default app;
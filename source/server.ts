import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import router from './routes';
import dbConnection from './models';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4200;

app.use(cors());
app.use(express.json());
app.use('/', router);

app.get('*', (_, res) => {
  res.status(400).send('Sorry, no page found :`(');
});

(async () => {
  try {
    await dbConnection;
    console.log('Mongoose Connected');

    app.listen(PORT, () => {
      console.log(`Server lives at ${PORT}`);
    });
  } catch (err) {
    console.log('Error:', err)
  }
})();
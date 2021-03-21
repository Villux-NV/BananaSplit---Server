import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import router from './routes';
import dbConnection from './models';

import http from 'http';
import { Server } from 'socket.io';

dotenv.config();

const PORT = process.env.PORT || 4200;

const app = express();
const socketServer = new http.Server(app);

const io = new Server(socketServer);

app.use(cors());
app.use(express.json());
app.use('/', router);

io.on('connection', (socket) => {
  socket.emit('init', { data: 'hallo!'})
});

app.get('*', (_, res) => {
  res.status(400).send('Sorry, no page found :`(');
});


(async () => {
  try {
    await dbConnection;
    console.log('Mongoose Connected');

    app.listen(PORT, () => {
      console.log(`Express Server lives at ${PORT}`);
    });

    io.listen(4300)
    // , () => {
    //   console.log(`Socket Server lives at 4300`);
    // });
  } catch (err) {
    console.log('Error:', err)
  }
})();

export default app;
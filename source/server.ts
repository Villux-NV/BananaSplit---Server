const express =require('express');
const cors =require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.get('*', (_, res) => {
  res.status(400).send('Sorry, no page found :`(');
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, (err) => {
  if (err) {
    console.log(`Server not alive, ${err}`);
  } else {
    console.log(`Server lives at ${PORT}`);
  }
});
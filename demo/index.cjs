const express = require('express');

const app = express();
app.use(express.static(__dirname));

const PORT = 8084;
app.listen(PORT, () => {
  console.log(`app started. listening to port ${PORT}`);
});
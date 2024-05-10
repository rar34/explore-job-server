const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;



app.use(cors({
    origin: ['http://localhost:5173/'],
    credentials: true,
    optionsSuccessStatus: 200
}))
app.use(express.json())




app.get("/", (req, res) => {
    res.send('App is running')
})

app.listen(port, () => {
    console.log(`App is running on port: ${port}`)
})
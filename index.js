const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;



app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true,
    optionsSuccessStatus: 200
}))
app.use(express.json())
app.use(cookieParser())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.orv8anl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// middlewares
const logger = (req, res, next) => {
    console.log('log info: ', req.method, req.url)
    next()
}

const verifyToken = (req, res, next) => {
    const token = req?.cookies?.token;
    // console.log('token in the middleware', token)
    if (!token) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'unauthorized access' })
        }
        req.user = decoded;
        next();
    })
    // next();
}

async function run() {
    try {
        const jobsCollection = client.db('exploreJobDb').collection('jobs');
        const bidsCollection = client.db('exploreJobDb').collection('bids');
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        // code for jwt
        app.post("/jwt", async (req, res) => {
            const user = req.body;
            // console.log(user)
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })


            res
                .cookie('token', token, {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'none'
                })
                .send({ success: true })


        })

        app.post('/logout', async (req, res) => {
            const user = req.body;
            console.log('logout', user)
            res.clearCookie('token', { maxAge: 0 }).send({ success: true })
        })


        app.get("/jobs", async (req, res) => {
            const result = await jobsCollection.find().toArray();
            res.send(result);
        })

        // add job into db
        app.post("/jobs", async (req, res) => {
            const newJob = req.body;
            // console.log(newJob)
            const result = await jobsCollection.insertOne(newJob)
            res.send(result)
        })

        // get a single job for details
        app.get("/job/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await jobsCollection.findOne(query);
            res.send(result)
        })

        // get all job added by user - my job
        app.get("/jobs/:email", async (req, res) => {
            const email = req.params.email;
            console.log("Token info", req.user)
            const query = { email: email }
            const result = await jobsCollection.find(query).toArray();
            res.send(result)
        })
        // get all applied job applied by user
        app.get("/appliedJobs/:email", async (req, res) => {
            const email = req.params.email;
            const query = { userEmail: email }
            const result = await bidsCollection.find(query).toArray();
            res.send(result)
        })

        // save applied job
        app.post("/bid", async (req, res) => {
            const bidJob = req.body;
            // console.log(bidJob)
            const result = await bidsCollection.insertOne(bidJob);
            res.send(result);
        })

        // update a job
        app.put("/jobs/:id", async (req, res) => {
            const id = req.params.id;
            const jobData = req.body;
            console.log(jobData)
            const query = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    ...jobData
                }
            }
            const result = await jobsCollection.updateOne(query, updateDoc, options)
            res.send(result)

        })

        // delete a job
        app.delete("/job/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await jobsCollection.deleteOne(query)
            res.send(result)
        })


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get("/", (req, res) => {
    res.send('App is running')
})

app.listen(port, () => {
    console.log(`App is running on port: ${port}`)
})
const express = require('express')
const app = express()
require('dotenv').config()
const cors = require('cors')
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
const jwt = require('jsonwebtoken')
const morgan = require('morgan')
const port = process.env.PORT || 5000

// middleware
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  optionSuccessStatus: 200,
}
app.use(cors(corsOptions))
app.use(express.json())
app.use(cookieParser())
app.use(morgan('dev'))
const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token
  console.log(token)
  if (!token) {
    return res.status(401).send({ message: 'unauthorized access' })
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.log(err)
      return res.status(401).send({ message: 'unauthorized access' })
    }
    req.user = decoded
    next()
  })
}

const client = new MongoClient(process.env.DB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
})
async function run() {
  try {
   
    // Send a ping to confirm a successful connection
    await client.db('admin').command({ ping: 1 })
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    )
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir)
//Collections
const usersCollection = client.db('TaskManagementDB').collection('users');
const tasksCollections = client.db('TaskManagementDB').collection('tasks');
 // auth related api
 app.post('/api/v1/jwt', async (req, res) => {
    const user = req.body
    console.log('I need a new jwt', user)
    const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: '365d',
    })
    res
      .cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      })
      .send({ success: true })
  })

  // Logout
  app.get('/api/v1/logout', async (req, res) => {
    try {
      res
        .clearCookie('token', {
          maxAge: 0,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        })
        .send({ success: true })
      console.log('Logout successful')
    } catch (err) {
      res.status(500).send(err)
    }
  })

  // Save or modify user email, status in DB
  app.post('/api/v1/users',verifyToken, async (req, res) => {
    try {
        const { email, name } = req.body;

        // Check if the user already exists
        const existingUser = await usersCollection.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create a new user
        const newUser = {
            email,
            name,
            timestamp: Date.now()
        };

        // Insert the new user into the collection
        const result = await usersCollection.insertOne(newUser);

        res.send(result);
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.put('/api/v1/users/:email',verifyToken, async (req, res) => {
    try {
        const email = req.params.email; // Extract email from URL parameter
        const user = req.body;

        // Define the query to find the user by email
        const query = { email: email };

        // Define options for the update operation (upsert: true means insert if not exists)
        const options = { upsert: true };

        // Check if the user exists
        const existingUser = await usersCollection.findOne(query);

        // If user doesn't exist, return a 404 Not Found response
        if (!existingUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Perform the update operation
        const result = await usersCollection.updateOne(
            query,
            {
                $set: { ...user, timestamp: Date.now() },
            },
            options
        );

        res.json(result); // Return the result of the update operation
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

//add tasks 
app.post('/api/v1/tasks',verifyToken, async(req,res)=>{
    try{
        const data = req.body;
        const result = await tasksCollections.insertOne(data);

        res.send(result);

    }catch (error) {
        res.status(500).send({ error: 'An error occurred', message: error.message });
      }
})
app.get('/api/v1/tasks',verifyToken, async (req, res) => {
    try {
        let query = {};
        if (req?.query?.email) {
            query = { ...query, email: req?.query?.email };
        }

        const tasks = await tasksCollections.find(query).toArray();

        // Calculate progress and completion status for each task
        const tasksWithProgressAndStatus = tasks.map(task => {
            const deadlineDate = new Date(task.deadline);
            const currentDate = new Date();
            const totalMilliseconds = deadlineDate - currentDate;
            const totalDays = Math.ceil(totalMilliseconds / (1000 * 60 * 60 * 24));
            let progressPercentage = null;

            if (totalDays > 0) {
                const daysRemaining = Math.ceil((deadlineDate - currentDate) / (1000 * 60 * 60 * 24));
                progressPercentage = Math.min(100, ((totalDays - daysRemaining) / totalDays) * 100);
            }

            // Check if task is completed
            const isCompleted = task.progressPercentage === 100;

            return { ...task, progressPercentage, totalDays, isCompleted };
        });

        res.send(tasksWithProgressAndStatus);
    } catch (error) {
        res.status(500).send({ error: 'An error occurred', message: error.message });
    }
});


app.delete('/api/v1/tasks/:id',verifyToken, async(req,res)=>{
    try{
        const id = req.params.id;
        const filter = {_id: new ObjectId(id)}
        const result = await tasksCollections.deleteOne(filter);

        res.send(result);

    }
    catch (error) {
        res.status(500).send({ error: 'An error occurred', message: error.message });
      }
})
app.get('/api/v1/tasks/:id',verifyToken, async(req,res)=>{
    try{
        const id = req.params.id;
        const filter = {_id: new ObjectId(id)}
        const result = await tasksCollections.findOne(filter);

        res.send(result);

    }
    catch (error) {
        res.status(500).send({ error: 'An error occurred', message: error.message });
      }
})
app.put('/api/v1/tasks/:id',verifyToken, async (req, res) => {
    try {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const newStatus = req.body.status;

        
        const update = { $set: { status: newStatus } };

        const result = await tasksCollections.updateOne(filter, update);

        res.send(result);
    } catch (error) {
        res.status(500).send({ error: 'An error occurred', message: error.message });
    }
});
app.patch('/api/v1/tasks/:id',verifyToken, async (req, res) => {
    try {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
        const updatedData = req.body;
      

        
        const update = { $set: {
            taskName: updatedData.taskName,
            taskDescription:updatedData.taskDescription ,
            deadline: updatedData.deadline,
            priority: updatedData.priority
        }};

        const result = await tasksCollections.updateOne(filter, update);
       
        // Check if the task is updated successfully
        if (result.modifiedCount === 1) {
            res.send({ success: true });
        } else {
            res.status(400).send({ success: false, message: 'Failed to update task' });
        }
    } catch (error) {
        res.status(500).send({ error: 'An error occurred', message: error.message });
    }
});





app.get('/', (req, res) => {
  res.send('Hello from Task Management Server..')
})

app.listen(port, () => {
  console.log(`Task Management Server is running on port ${port}`)
})
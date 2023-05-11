const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");

require("dotenv").config();

const port = process.env.PORT || 5000;

const app = express();
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_Pass}@cluster0.neres47.mongodb.net/?retryWrites=true&w=majority`;

// console.log(uri);
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send("unauthorized");
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}
async function run() {
  try {
    const usersCollection = client.db("mPair").collection("users");
    const employeeCollection = client.db("mPair").collection("employees");
    app.get("/jwt", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      if (user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, {
          expiresIn: "1h",
        });
        return res.send({ accessToken: token });
      }
      res.status(403).send({ accessToken: "" });
    });
    app.get("/users", async (req, res) => {
      const query = {};

      const users = await usersCollection.find(query).toArray();
      res.send(users);
    });
    app.get("/allEmployees", async (req, res) => {
      const { title } = req.query;
      let query = {};

      if (title && title !== "all") {
        query.job_Title = title;
      } else {
        query = {};
      }
      console.log(query);
      const users = await employeeCollection.find(query).toArray();
      console.log(users);
      res.send(users);
    });
    app.post("/addEmployee", async (req, res) => {
      const allData = req.body;

      const query = {
        email: allData.email,
      };

      const alreadyUser = await employeeCollection.find(query).toArray();

      if (alreadyUser.length) {
        const message = `You already have inserted data on this email ${allData.email}`;
        return res.send({ acknowledged: false, message });
      }
      const result = await employeeCollection.insertOne(allData);

      res.send(result);
    });

    app.put("/updateSalary", async (req, res) => {
      console.log(req.query);
      const id = req.query.id;
      const updatedSalary = req.body;
      console.log(updatedSalary, id);
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          salary: updatedSalary.salary,
        },
      };
      const result = await employeeCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isAdmin: user?.role === "admin" });
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      console.log(user);
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    app.put("/users/admin/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await usersCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
    });
  } finally {
  }
}
run().catch(console.log);

app.get("/", async (req, res) => {
  res.send("doctor is liseingg");
});
app.listen(port, () => {
  console.log("running", port);
});
// amirul;
// LIOQstlZiNQbUBIn
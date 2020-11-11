import express from "express";
import mongoose from "mongoose";
import Message from "./db-message.js";

import Pusher from "pusher";

// app config
const app = express();
const port = process.env.PORT || 9000;

//middleware

app.use(express.json());

//db config
const connection_url =
  "mongodb+srv://admin:7c5p3Cld0msptNpo@cluster0.fyjnb.mongodb.net/whatappdb?retryWrites=true&w=majority";
mongoose.connect(connection_url, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const pusher = new Pusher({
  appId: "1105744",
  key: "38f26a6ead51b4a6f039",
  secret: "4a0d033f136fe49fa6ad",
  cluster: "ap2",
  useTLS: true,
});

const db = mongoose.connection;

db.once("open", () => {
  console.log("DB Connected");

  const msgCollection = db.collection("messagecontents");
  const changeStream = msgCollection.watch();

  changeStream.on("change", (change) => {
    if (change.operationType == "insert") {
      const messageDetail = change.fullDocument;
      pusher.trigger("my-channel", "my-event", {
        message: messageDetail.message,
        name: messageDetail.name,
        timestamp: messageDetail.timestamp,
        received: messageDetail.received,
      });
    } else {
      console.log("Error while push");
    }
  });
});

// pusher.trigger("my-channel", "my-event", {
//   message: "hello world",
// });

// ???

//api
app.get("/", (req, res) => res.status(200).send("hello world"));

app.post("/api/v1/messages/new", (req, res) => {
  const dbMessage = req.body;

  Message.create(dbMessage, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(`new message created : ${data}`);
    }
  });
});

app.get("/api/v1/messages", (req, res) => {
  Message.find((err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
});

app.delete("/api/v1/messages", (req, res) => {
  const request = req.body;
  console.log(request);
  Message.deleteOne({ id: mongoose.ObjectId(request.id) }, (err) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(`Message of id ${request.id} has been deleted`);
    }
  });
});

//listen
app.listen(port, () => console.log(`Listering on localhost : ${port}`));

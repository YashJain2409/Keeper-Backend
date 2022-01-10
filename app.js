//jshint esversion:6
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const app = express();
app.use(bodyParser.json());
mongoose.connect("mongodb://localhost:27017/noteDB");

const noteSchema = new mongoose.Schema({
  noteId: String,
  title: String,
  content: String,
});
const Note = mongoose.model("Note", noteSchema);

app.get("/fetchNotes", (req, res) => {
  Note.find(function (err, notes) {
    if (err) console.log(err);
    else {
      console.log("fetched");
      res.json(notes);
    }
  });
});
app.post("/add", (req, res) => {
  const newNote = new Note({
    noteId: req.body.id,
    title: req.body.title,
    content: req.body.content,
  });
  newNote.save(function (err) {
    if (!err) 
    console.log("successfully added");
  });
  res.end();
});

app.post("/delete", (req, res) => {
  Note.findOneAndDelete({ noteId: req.body.id }, function (err) {
    if (!err) console.log("successfully deleted");
  });
  res.end();
});
app.listen(3001, () => {
  console.log("listening on port 3001");
});

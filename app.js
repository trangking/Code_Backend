const express = require("express");
const cors = require("cors");
const mysql = require("mysql");
const app = express();
const jwt = require("jsonwebtoken");
const Tokendata = "TestToppun";
const bcrypt = require("bcrypt");
const saltRounds = 10;
const bodyParser = require("body-parser");
const csv = require("csv-parse");
const fs = require("fs");
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "testdata",
});

app.post("/create", (req, res) => {
  const name = req.body.name;
  const password = req.body.password;

  bcrypt.hash(password, saltRounds, (err, hash) => {
    db.query(
      "INSERT INTO user (name, password) VALUES (?, ?)",
      [name, hash],
      (err, result) => {
        if (err) {
          console.log(err);
          return res.status(500).send("Failed to insert data");
        }
        res.send("Insert DATA");
      }
    );
  });
});

app.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.userpassword;
  db.query(
    "SELECT * FROM user WHERE name = ?",
    [username],
    async (err, result) => {
      if (err) {
        console.log({ status: "error", message: err });
        return;
      }
      if (result.length == 0) {
        res.send({ status: "error", message: "No user" });
        return;
      }
      await bcrypt.compare(password, result[0].password, (err, isMatch) => {
        if (isMatch) {
          var token = jwt.sign({ name: result[0].name }, Tokendata, {
            expiresIn: "1h",
          });
          res.send({ status: "ok", message: "login successful", token });
        } else {
          res.send({ status: "error", message: "invalid password" });
        }
      });
    }
  );
});

app.post("/authen", (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, Tokendata);
    res.json({ status: "ok", decoded });
  } catch (err) {
    res.json({ status: "error", message: err.message });
  }
});




const multer = require("multer");
const upload = multer({ dest: "uploads/" });

app.post("/upload", upload.single("file"), (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).send("No file uploaded");
  }

  const results = [];
  fs.createReadStream(file.path)
    .pipe(csv({}))
    .on("data", (data) => {
      const [username, department, license, installed, brand, model, serial] =
        data;
      results.push([
        username,
        department,
        license,
        installed,
        brand,
        model,
        serial,
      ]);
    })
    .on("end", () => {
      const sql = `INSERT INTO computer_listtoppun (username, department, license, installed, brand, model, serial) VALUES ?`;
      db.query(sql, [results], (error, results) => {
        if (error) {
          console.error(error);
          return res.status(500).send("Failed to insert data into database");
        }

        fs.unlinkSync(file.path);

        console.log("CSV file successfully processed");
        res.send("File uploaded successfully");
      });
    });
});

app.get("/showData", (req, res) => {
  db.query(
    "SELECT username,department,license,Installed,brand,model,serial,ID FROM computer_listtoppun",
    (err, data) => {
      if (err) {
        return res.json(err);
      } else {
        return res.json(data);
      }
    }
  );
});

app.listen("3001", () => {});

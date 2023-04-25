const sqlite3 = require("sqlite3").verbose();
const express = require("express");
const jwt = require("jsonwebtoken");

const bcrypt = require("bcrypt");
const port = 3001;
const app = express();
app.use(express.json());

app.listen(port, () => {
  console.log("sever connected");
});

const db = new sqlite3.Database("./app.db", (err) => {
  if (err) {
    console.log(err.message);
  }
});

const passwordcharecter = (password) => {
  if (password.length <= 8) {
    return "password length must be more than 8 charectes";
  } else if (password.search(/[A-Z]/) === -1) {
    return "password must contain uppercase letter";
  } else if (password.search(/[a-z]/) === -1) {
    return "password must contain lowercase letter";
  } else if (password.search(/[!@#$%^&*)(":;'>.<,`}/]/) === -1) {
    return "password must contsain specail charecter";
  } else {
    return true;
  }
};

app.post("/register", async (request, response) => {
  const userDetails = request.body;
  const { username, password } = userDetails;
  const complexitypassowrd = passwordcharecter(password);

  if (complexitypassowrd === true) {
    const encryptedpassword = await bcrypt.hash(password, 10);
    const query = `INSERT INTO user(username,password) VALUES('${username}','${encryptedpassword}');`;
    const isuserexistQ = `SELECT * FROM user WHERE username = '${username}';`;
    db.all(isuserexistQ, (err, rows) => {
      if (err) {
        console.log(err);
        throw err;
      } else {
        if (rows.length == 0) {
          db.run(query);
          response.status(200);
          response.send("user created successfully");
        } else {
          response.send("username already exist");
        }
      }
    });
  } else {
    response.status(400);
    response.send(complexitypassowrd);
  }
});

app.post("/login", async (request, response) => {
  const userDetails = request.body;
  const { username, password } = userDetails;
  const encryptedpassword = await bcrypt.hash(password, 10);
  const payload = {
    username: username,
  };
  const jwttok = await jwt.sign(payload, "mysecrettoken");

  db.all(
    `SELECT * FROM user WHERE username = '${username}' AND password='${encryptedpassword}';`,
    (err, rows) => {
      if (err) {
        throw err;
      }
      if (rows !== undefined) {
        response.status(200);
        response.send({
          message: "login success",
          jwtToken: jwttok,
        });
      } else {
        response.status(401);
        response.send("invalid username or password");
      }
    }
  );
});

//api for getting all users
app.get("/users", async (request, response) => {
  try {
    const query = `SELECT * FROM user;`;
    let params = [];
    let users = await all(query, params);
    if (users) {
      console.log(users);
      response.send(users);
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error });
    return;
  }
});


function all(query, params) {
  return new Promise((resolve, reject) => {
    db.all(query, params, async (err, rows) => {
      if (err) {
        return reject(err.message);
      }
      return resolve(rows);
    });
  });
}

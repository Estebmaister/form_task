const express = require("express");
// const app = express();
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

// const myApp = require("./myApp");
const app = require("./myApp").app;

app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "views", "index.html"))
);

app.use(express.static(path.join(__dirname, "public")));

// ______ ROUTER FUNCTIONS ________ //

app.get("/file/*?", function (req, res, next) {
  if (req.params[0] === ".env") {
    return next({ status: 401, message: "ACCESS DENIED" });
  }
  fs.readFile(path.join(__dirname, req.params[0]), function (err, data) {
    if (err) {
      return next(err);
    }
    res.type("txt").send(data.toString());
  });
});

app.get("/is-mongoose-ok", function (req, res) {
  if (mongoose) {
    res.json({ isMongooseOk: !!mongoose.connection.readyState });
  } else {
    res.json({ isMongooseOk: false });
  }
});

// ______ DB FUNCTIONS (Testing, Create, Read)________ //

// global setting for safety timeouts to handle possible
// wrong callbacks that will never be called
const timeout = 3000;

const Address = require("./myApp.js").AddressModel;

app.use(function (req, res, next) {
  if (req.method !== "OPTIONS" && Address.modelName !== "Address") {
    return next({ message: "Address Model is not correct" });
  }
  next();
});

app.post("/mongoose-model", function (req, res, next) {
  // try to create a new instance based on their model
  // verify it's correctly defined in some way
  let p;
  p = new Address(req.body);
  res.json(p);
});

const createAddress = require("./myApp.js").createAndSaveAddress;

app.get("/create-and-save-address", function (req, res, next) {
  // in case of incorrect function use wait timeout then respond
  let t = setTimeout(() => {
    next({ message: "timeout" });
  }, timeout);
  createAddress(function (err, data) {
    clearTimeout(t);
    if (err) {
      return next(err);
    }
    if (!data) {
      console.log("Missing `done()` argument");
      return next({ message: "Missing callback argument" });
    }
    Address.findById(data._id, function (err, pers) {
      if (err) {
        return next(err);
      }
      res.json(pers);
      // pers.remove();
    });
  });
});

const findByName = require("./myApp.js").findAddressByName;

app.post("/find-all-by-name", function (req, res, next) {
  let t = setTimeout(() => {
    next({ message: "timeout" });
  }, timeout);
  Address.create(req.body, function (err, adr) {
    if (err) {
      return next(err);
    }
    findByName(adr.fullName, function (err, data) {
      clearTimeout(t);
      if (err) {
        return next(err);
      }
      if (!data) {
        console.log("Missing `done()` argument");
        return next({ message: "Missing callback argument" });
      }
      res.json(data);
      // Address.remove().exec();
    });
  });
});

// ______ EXTRA FUNCTIONS (404, package.json, ip)________ //

app.get("/package.json", function (req, res, next) {
  fs.readFile(__dirname + "/package.json", function (err, data) {
    if (err) return next(err);
    res.type("txt").send(data.toString());
  });
});

app.get("/ip", (req, res) => {
  console.log(req.ip);
  let ip = req.ip.split(":");
  let ip_details = req.socket.address();
  console.log(ip_details); // { address: '::ffff:127.0.0.1', family: 'IPv6', port: 3000
  ip[3] ? res.json({ ip: ip[3] }) : res.json({ ip: ip[0] });
});

app.use(function (req, res, next) {
  res.status(404).type("txt").send("Not Found in the server");
});

// Error handler
app.use(function (err, req, res, next) {
  if (err) {
    res
      .status(err.status || 500)
      .type("txt")
      .send(err.message || "SERVER ERROR");
  }
});

// Unmatched routes handler
app.use(function (req, res) {
  if (req.method.toLowerCase() === "options") {
    res.end();
  } else {
    res.status(404).type("txt").send("Not Found");
  }
});

// ______ CONNECTION TO THE PORT ________ //

const port = process.env.PORT || 3000;
const listener = app.listen(port, "localhost", () =>
  console.log(
    `Form_task app is listening at http://${listener.address().address}:${
      listener.address().port
    }`
  )
);

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const builder = require("xmlbuilder");

// const app = require("./app");
const app = require("./app").app;

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
const timeout = 10000;

const Address = require("./app.js").AddressModel;

app.use((req, res, next) => {
  if (req.method !== "OPTIONS" && Address.modelName !== "Address")
    return next({ message: "Address Model is not correct" });
  next();
});

const createAndSaveAddress = require("./app.js").createAndSaveAddress;

app
  .route("/create_address")
  .get((req, res, next) => {
    // in case of incorrect function use wait timeout then respond
    const tCheck = setTimeout(() => {
      next({ message: "timeout" });
    }, timeout);
    createAndSaveAddress((err, data) => {
      clearTimeout(tCheck);
      if (err) return next(err);
      if (!data) {
        console.log("No data is retrieved");
        return next({ message: "The DB didn't retrieve any data" });
      }
      Address.findById(data._id, (err, addr) => {
        if (err) return next(err);
        res.json(addr);
        addr.remove();
      });
    });
  })
  .post((req, res, next) => {
    const tCheck = setTimeout(() => {
      next({ message: "timeout" });
    }, timeout);
    Address.create(req.body, (err, addr) => {
      if (err) return next(err);
      Address.findById(addr._id, (err, data) => {
        clearTimeout(tCheck);
        if (err) {
          return next(err);
        }
        if (!data) {
          console.log("No data is retrieved");
          return next({ message: "The DB didn't retrieve any data" });
        }
        res.json(data);
        // data.remove();
      });
    });
  });

app.route("/show_data_xml").get((req, res, next) => {
  // in case of incorrect function use wait timeout then respond
  const tCheck = setTimeout(() => {
    next({ message: "timeout" });
  }, timeout);
  Address.find({}, "-__v -_id", (err, addr) => {
    clearTimeout(tCheck);
    if (err) return next(err);
    if (!addr) {
      console.log("No data is retrieved");
      return next({ message: "The DB didn't retrieve any data" });
    }
    const rootXML = {
      addresses: {
        address: JSON.parse(JSON.stringify(addr)),
      },
    };
    const xml = builder.create(rootXML).end({ pretty: true });
    res.status(200).type("application/xml").send(xml);
  });
});

app.route("/show_data_json").get((req, res, next) => {
  // in case of incorrect function use wait timeout then respond
  const tCheck = setTimeout(() => {
    next({ message: "timeout" });
  }, timeout);
  Address.find({}, "-__v -_id", (err, addr) => {
    clearTimeout(tCheck);
    if (err) return next(err);
    if (!addr) {
      console.log("No data is retrieved");
      return next({ message: "The DB didn't retrieve any data" });
    }
    res.status(200).type("application/x-javascript").json(addr);
  });
});

// const findByName = require("./app.js").findAddressByName;
// findByName(addr.fullName, (err,data) => {})

app
  .route("/check")
  .get((req, res, next) => {
    // in case of incorrect function use wait timeout then respond
    const tCheck = setTimeout(() => {
      next({ message: "timeout" });
    }, timeout);
    createAndSaveAddress((err, addr) => {
      clearTimeout(tCheck);
      if (err) return next(err);
      Address.findById(addr._id, (err, addr) => {
        if (err) return next(err);
        res.json(addr);
        addr.remove();
      });
    });
  })
  .post((req, res, next) => {
    const tCheck = setTimeout(() => {
      next({ message: "timeout" });
    }, timeout);
    // Create a new Document for Address model and a callback func to check it
    Address.create(req.body, (err, addr) => {
      if (err) return next(err);
      Address.findById(addr._id, (err, data) => {
        clearTimeout(tCheck);
        if (err) return next(err);
        res.status(200).json(data);
        data.remove();
      });
    });
  });

// ______ EXTRA FUNCTIONS (mongoose_model, package.json, ip, 500, 404)________ //

app.post("/mongoose_model", (req, res, next) => {
  // try to create a new instance based on their model
  // verify it's correctly defined in some way
  const p = new Address(req.body);
  res.json(p);
});

app.get("/package.json", (req, res, next) => {
  fs.readFile(__dirname + "/package.json", (err, data) => {
    if (err) return next(err);
    res.status(200).type("txt").send(data.toString());
  });
});

app.get("/ip", (req, res) => {
  console.log(req.ip);
  let ip = req.ip.split(":");
  let ip_details = req.socket.address();
  console.log(ip_details); // { address: '::ffff:127.0.0.1', family: 'IPv6', port: 3000
  ip[3]
    ? res.status(200).json({ ip: ip[3] })
    : res.status(200).json({ ip: ip[0] });
});

// Error handler
app.use((err, req, res, next) => {
  if (err) {
    res
      .status(err.status || 500)
      .type("txt")
      .send(err.message || "SERVER ERROR");
  }
});

// Unmatched routes handler
app.use((req, res) => {
  if (req.method.toLowerCase() === "options") {
    res.end();
  }
  res.status(404).type("txt").send("Not Found in the server");
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

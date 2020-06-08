const express = require("express");
const app = express();

// Mounting the body-parser middleware for post request
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
console.log("Body parser activated");

// # MONGOOSE SETUP #
require("dotenv").config();
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// mongoose.connect(<Your URI>, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => console.log("Connected to MongoDB"));

/** # SCHEMAS and MODELS #
/*  ====================== */

const adrSchema = new Schema({
  fullName: { type: String, required: true },
  address: String,
  address_cont: String,
  city: String,
  state: String,
  zip: String,
  tel: String,
  country: String,
});

const Address = mongoose.model("Address", adrSchema);

/** # [C]RUD - CREATE #
/*  ========================== */
/** Create and Save an Address */

const createAndSaveAddress = (done) => {
  let estebAdr = new Address({
    fullName: "Ejemplo de nombre",
    address: "Dirección inicial",
    address_cont: "Dirección final",
    city: "Ciudad Bogotá",
    state: "Estado DC",
    zip: "110111",
    tel: "3057772628",
    country: "Colombia",
  });

  estebAdr.save((err, data) => {
    if (err) return done(err);
    done(null, data);
  });
};

/** # C[R]UD READ #
/*  ========================= */
/** Use `Model.find()` */

const findAddressesByName = (addressesName, done) => {
  Address.find({ fullName: addressesName }, (err, addressesFound) => {
    if (err) return done(err);
    done(null, addressesFound);
  });
};

/* Send data to client --date-- */
app.get(
  "/now",
  (req, res, next) => {
    req.time = new Date().toString();
    next();
  },
  (req, res) => {
    res.json({ time: req.time });
  }
);

/** Get input from client - Route parameters */
app.get("/:word/echo", (req, res) => res.json({ echo: req.params.word }));

/** Get input from client - Query parameters or POST body*/
// /name?first=<firstname>&last=<lastname>
app
  .route("/form_check")
  .get((req, res) => res.json({ name: `${req.query.first} ${req.query.last}` }))
  .post((req, res) =>
    res.json({
      fullName: `${req.body.fullName}`,
      address: `${req.body.address}`,
      address_cont: `${req.body.address_cont}`,
      city: `${req.body.city}`,
      state: `${req.body.state}`,
      zip: `${req.body.zip}`,
      tel: `${req.body.tel}`,
      country: `${req.body.country}`,
    })
  );

exports.app = app;
exports.AddressModel = Address;
exports.createAndSaveAddress = createAndSaveAddress;
exports.findAddressesByName = findAddressesByName;

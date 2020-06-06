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
    fullName: "Esteban camargo",
    address: "Av. Bolivia, Urb. Los Caobos Sur, Edif. Terepaima",
    address_cont: "Cra. 17a",
    city: "LIBERTADOR",
    state: "DISTRITO CAPITAL",
    zip: "01010",
    tel: "04169312768",
    country: "Venezuela",
  });

  estebAdr.save((err, data) => {
    if (err) return console.error(err);
    done(null, data);
  });
};

/** # C[R]UD READ #
/*  ========================= */
/** Use `Model.find()` */

const findAddressByName = function (addressName, done) {
  Address.find({ fullName: addressName }, function (err, addressFound) {
    if (err) return console.log(err);
    done(null, addressFound);
  });
};

/* Send data to client --date-- */
app.get(
  "/now",
  function (req, res, next) {
    req.time = new Date().toString();
    next();
  },
  function (req, res) {
    res.json({ time: req.time });
  }
);

/** Get input from client - Route parameters */

app.get("/:word/echo", (req, res) => res.json({ echo: req.params.word }));

/** Get input from client - Query parameters */
// /name?first=<firstname>&last=<lastname>
/** Get data form POST  */
app
  .route("/form")
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
exports.findAddressByName = findAddressByName;

//Use Express
const express = require("express");
const app = express();

//Use dotenv
require("dotenv").config();

//Contact model
const Contact = require("./models/phonebook");

//Use CORS
const cors = require("cors");

//Use Morgan
const morgan = require("morgan");

//APP
const Port = process.env.PORT || 3002;
app.listen(Port, () => {
  console.log(`Server running on port: ${Port}`);
});

//Middleware:
//Json-Parser
app.use(express.json());

//CORS:
const whitelist = [
  "https://back-end-phonebook.onrender.com",
  "http://localhost:5173",
  "http://localhost:3001",
];

const originfirewall = (origin, callback) => {
  if (!origin) {
    return callback(null, true);
  }

  if (whitelist.includes(origin)) {
    return callback(null, true);
  }

  return callback(`Access denied!`, false);
};

app.use(
  cors({
    origin: originfirewall,
  })
);

//Static: React - App
app.use(express.static("./dist"));

//Morgan tiny
app.use(morgan("tiny"));

//Morgan Token
morgan.token("body", (req, res) =>
  req.body ? "Body: " + JSON.stringify(req.body) : "Not found body..."
);
app.use(morgan(":method :url :response-time ms :body"));

//Server EndPoints - Route Controllers:
//Get:
app.get("/api/persons", (request, response) => {
  Contact.find({}).then((result) => {
    response.json(result);
  });
});

app.get("/info", (request, response) => {
  const date = new Date();
  Contact.countDocuments({}).then((result) => {
    const info = `
    <h2>PhoneBook Info</h2>
    <p>Phonebook has info for ${result} persons</p>
    <p>${date}</p>
    `;
    response.send(info);
  });
});

app.get("/api/persons/:id", (request, response, next) => {
  const id = request.params.id;
  if (id.length != 24) return response.status(400).json({ Error: "Bad id!" });
  Contact.findById(id)
    .then((result) => {
      if (!result) {
        response.statusMessage = "Person not found";
        return response.status(404).json({
          status: "Not found",
        });
      }
      return response.json(result);
    })
    .catch((e) => next(e));
});

//Delete:
app.delete("/api/persons/:id", (request, response, next) => {
  const id = request.params.id;
  Contact.findByIdAndDelete(id)
    .then((result) => {
      if (result) {
        response.statusMessage = "Deleted successfully";
        response.status(204).end();
      }
      response.status(404).end();
    })
    .catch((error) => next(error));
});

//Post
const validations = (name, number) => {
  if (!name || !number || !name.trim() || !number.trim()) {
    return {
      statusError: true,
      message: "Missing values",
      status: "Mising values",
    };
  }
  const regex = /^[0-9\-]+$/;
  if (!regex.test(number))
    return {
      statusError: true,
      message: "Invalid number: use only digits and the hyphen -",
      status: "Invalid number",
    };
  return { statusError: false };
};

//Post:
app.post("/api/persons", (request, response, next) => {
  const body = request.body;
  const val = validations(body.name, body.number);

  if (val.statusError) {
    response.statusMessage = val.status;
    return response.status(400).json({ error: val.message });
  }

  const contactSv = new Contact({
    name: body.name,
    number: body.number,
  });

  contactSv
    .save()
    .then((result) => {
      response.json(result);
    })
    .catch((error) => next(error));
});

app.put("/api/persons/:id", (request, response, next) => {
  const id = request.params.id;
  const body = request.body;

  const upContact = {
    name: body.name,
    number: body.number,
  };

  Contact.findByIdAndUpdate(id, upContact, {
    new: true,
    runValidators: true,
    context: "query",
  })
    .then((result) => {
      response.json(result);
    })
    .catch((error) => next(error));
});

//Unknown Endpoints Middleware
const unknownEndpoint = (request, response) => {
  response.status(404).json({
    status: "Unknown Endpoint",
  });
};
app.use(unknownEndpoint);

//Last middleware - Error Handler
const ErrorHandler = (error, request, response, next) => {
  console.log(error.message);

  switch (error.name) {
    case "CastError":
      return response.status(400).json({ status: "malformatted ID" });
      break;
    case "ValidationError":
      return response.status(400).json({ status: error.message });
      break;
    default:
      return response
        .status(500)
        .json({ status: "Server error, try later..." });
      break;
  }

  next(error);
};

app.use(ErrorHandler);

const mongoose = require("mongoose");

const url = process.env.URI_ATLAS;

mongoose
  .connect(url)
  .then((res) => {
    console.log("Conected to MongoAtlas");
  })
  .catch((e) => {
    console.log(`Conection error: ${e.message}`);
  });

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    minLength: 5,
    required: true,
  },
  number: String,
});

contactSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

module.exports = mongoose.model("Contact", contactSchema);

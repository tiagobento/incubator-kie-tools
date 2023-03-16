export default {
  $schema: "http://json-schema.org/draft-04/schema#",
  title: "Expression",
  description: "Schema for expression test",
  type: "object",
  properties: {
    numbers: {
      description: "The array of numbers to be operated with",
      type: "array",
      items: {
        type: "object",
        properties: {
          x: { type: "number" },
          y: { type: "number" },
        },
      },
    },
  },
  required: ["numbers"],
};

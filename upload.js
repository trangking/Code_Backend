const csv = require("csv-parse");
const fs = require("fs");
const result = [];

fs.createReadStream("computer-list.csv")
  .pipe(csv({}))
  .on("data", (data) => {
    result.push(data);
  })
  .on("end", () => {
    console.log(result);
  });
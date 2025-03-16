import fs from "fs";
import chalk from "chalk";
import { input } from "@inquirer/prompts";

// Note there are more items with non-64 stack sizes such as potions,
// but I couldn't be bothered to type them all out :P
const stackSizes = JSON.parse(fs.readFileSync("itemStacks.json", { encoding: "utf-8" }));

const getStackSize = (itemName) => {
  // Check if a custom stack size exists for this item
  return stackSizes[itemName.toLowerCase()] || stackSizes["default"];
};

// Function to calculate stacks and items
const calculateStacksAndItems = (total, itemName) => {
  const stackSize = getStackSize(itemName);
  const stacks = Math.floor(total / stackSize);
  const items = total % stackSize;
  return { stacks, items };
};

const displayItems = async (data) => {
  try {
    // This can be modified to any value!
    const itemsPerPage = 5;
    let currentIndex = 0;

    while (currentIndex < data.length) {
      const pageData = data.slice(currentIndex, currentIndex + itemsPerPage); // Get the next 5 items

      console.log(
        "\n" +
          chalk.green.bold("Item".padEnd(25)) +
          " | " +
          chalk.cyan.bold("Stacks".padEnd(10)) +
          " | " +
          chalk.yellow.bold("Items".padEnd(10))
      );
      console.log(chalk.gray("-".repeat(51)));

      pageData.forEach((row) => {
        const item = row["Item"] || "N/A";
        const stacks = row["Stacks"] || "0";
        const items = row["Items"] || "0";
        console.log(
          chalk.magenta(item.padEnd(25)) +
            " | " +
            chalk.blue(String(stacks).padStart(10)) +
            " | " +
            chalk.red(String(items).padStart(10))
        );
      });

      // Prompt user to continue
      console.log();
      const continueResponse = await input({
        message: "Press Enter to continue or type 'exit' to stop:",
      });

      if (continueResponse.toLowerCase() === "exit") break;
      currentIndex += itemsPerPage;
    }

    console.log();
    await input({
      message: chalk.green("End of list; press Enter to continue..."),
    });
  } catch (err) {
    if (err.name === "ExitPromptError") {
      process.exit(1);
    }
  }
};

const convertValue = (value) => {
  // Remove quotes around values
  value = value.replace(/^"(.*)"$/, "$1");

  // Check if the value is a number and convert
  if (!isNaN(value) && value.trim() !== "") {
    return parseFloat(value);
  }
  return value;
};

const getCSVFilename = async () => {
  try {
    const csvFilename = await input({
      message: "Enter the filename of the CSV file:",
      default: "list.csv",
      required: true,
      validate: (value) => {
        if (!fs.existsSync(value)) return false;
        else return true;
      },
    });

    return csvFilename;
  } catch (err) {
    if (err.name === "ExitPromptError") {
      process.exit(1);
    }
  }
};

const csvFilename = await getCSVFilename();
const data = fs.readFileSync(csvFilename, "utf8");

// Remove any \r characters
const cleanedData = data.replace(/\r/g, "");

// Split data into lines (rows)
const lines = cleanedData.split("\n");
const headers = lines[0].split(",");
const results = [];

// Process each line of CSV data (skip the first line since it's the header)
for (let i = 1; i < lines.length; i++) {
  const row = lines[i].split(","); // Split each row into columns
  if (row.length === headers.length) {
    const rowObject = {};
    for (let j = 0; j < headers.length; j++) {
      // Clean the key and the value (remove quotes)
      const cleanedHeader = headers[j].replace(/^"(.*)"$/, "$1");
      const cleanedValue = convertValue(row[j]);
      rowObject[cleanedHeader] = cleanedValue;
    }

    delete rowObject["Missing"];
    delete rowObject["Available"];

    // Replace 'Total' with Stacks and Items
    if (rowObject["Total"]) {
      const { stacks, items } = calculateStacksAndItems(rowObject["Total"], rowObject["Item"]);
      rowObject["Stacks"] = stacks;
      rowObject["Items"] = items;
      delete rowObject["Total"];
    }

    results.push(rowObject);
  }
}

displayItems(results);

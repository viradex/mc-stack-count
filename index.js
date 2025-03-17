#!/usr/bin/env node

import fs from "fs";
import chalk from "chalk";
import { input } from "@inquirer/prompts";

// Note: this does not work with Prettier. Uncomment line 16 and comment out the following line when developing
import stackSizes from "./itemStacks.json" with { type: "json" };

/**
 * The amount of items to display at a time.
 */
const ITEMS_PER_PAGE = 5;

// Uncomment this line when developing so that it works with Prettier:
// const stackSizes = JSON.parse(fs.readFileSync("itemStacks.json", { encoding: "utf-8" }));

/**
 * Gets the custom stack size of the block/item, or 64 by default.
 *
 * @param {string} itemName The name of the block or item.
 * @returns The number that the block/item can stack to.
 */
const getStackSize = (itemName) => stackSizes[itemName.toLowerCase()] || stackSizes["default"];

/**
 * Calculates the stacks, items, and shulker boxes needed for an item.
 *
 * @param {number} total The total amount of the specific block/item required for the build.
 * @param {string} itemName The name of the item, for finding the stack limit.
 * @returns An object containing the stacks, items, and shulker boxes.
 */
const calculateStacksAndItems = (total, itemName) => {
  const stackSize = getStackSize(itemName);
  const stacks = Math.floor(total / stackSize);
  const items = total % stackSize;
  const shulkerBoxes = Math.floor(stacks / 27);
  const remainingStacks = stacks - shulkerBoxes * 27;

  return { stacks: remainingStacks, items, shulkerBoxes };
};

/**
 * Display the items in the table, showing shulker boxes before stacks.
 *
 * @param {[ { Item: string, Shulkerboxes?: number, Stacks: number, Items: number } ]} data An array of nested objects containing information about each item.
 */
const displayItems = async (data) => {
  try {
    let currentIndex = 0;

    while (currentIndex < data.length) {
      const pageData = data.slice(currentIndex, currentIndex + ITEMS_PER_PAGE);

      console.log(
        "\n" +
          chalk.green.bold("Item".padEnd(25)) +
          " | " +
          chalk.magenta.bold("Shulkers".padEnd(10)) +
          " | " +
          chalk.cyan.bold("Stacks".padEnd(10)) +
          " | " +
          chalk.yellow.bold("Items".padEnd(10))
      );
      console.log(chalk.gray("-".repeat(65)));

      pageData.forEach((row) => {
        const item = row["Item"] || "N/A";
        const shulkers = String(row["Shulkerboxes"] ?? 0);
        const stacks = row["Stacks"] || "0";
        const items = row["Items"] || "0";

        console.log(
          chalk.magenta(item.padEnd(25)) +
            " | " +
            chalk.green(shulkers.padStart(10)) +
            " | " +
            chalk.blue(String(stacks).padStart(10)) +
            " | " +
            chalk.red(String(items).padStart(10))
        );
      });

      console.log();
      const continueResponse = await input({
        message: "Press Enter to continue or type 'exit' to stop:",
      });

      if (continueResponse.toLowerCase() === "exit") process.exit(0);
      currentIndex += ITEMS_PER_PAGE;
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

/**
 * Convert strings containing numbers into numbers and removes double quotes surrounding strings.
 *
 * @param {string | any} value The value to convert.
 * @returns The converted value.
 */
const convertValue = (value) => {
  // Remove quotes around values
  value = value.replace(/^"(.*)"$/, "$1");

  // Check if the value is a number and convert
  if (!isNaN(value) && value.trim() !== "") return parseFloat(value);
  return value;
};

/**
 * Prompts the user to enter the CSV filename.
 *
 * @returns The name and location of the CSV file.
 */
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

    // Replace 'Total' with Stacks, Items, and Shulkerboxes
    if (rowObject["Total"]) {
      const { stacks, items, shulkerBoxes } = calculateStacksAndItems(
        rowObject["Total"],
        rowObject["Item"]
      );
      rowObject["Stacks"] = stacks;
      rowObject["Items"] = items;
      rowObject["Shulkerboxes"] = shulkerBoxes;
      delete rowObject["Total"];
    }

    results.push(rowObject);
  }
}

displayItems(results);

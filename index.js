const inputString = ``;

const lines = inputString.trim().split("\n");

// TODO:
// - Make it possible to enter a text file instead of editing code for list
// - Make custom format, instead of console.table
// - Add "continue listing items" prompt every 5-10 items
// - For 16-stack or 1-stack items, show respective stack amount
const materials = lines
  .map((line) => {
    const match = line.match(/\|\s*(.+?)\s*\|\s*(\d+)\s*\|/);
    if (match) {
      const amount = parseInt(match[2], 10);
      return {
        name: match[1].trim(),
        stacks: Math.floor(amount / 64), // Full stacks (64 items each)
        items: amount % 64, // Remaining items
      };
    }
    return null;
  })
  .filter(Boolean);

console.table(materials);

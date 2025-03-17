# MC Stack Count

Get the stacks and items for a list of items in Minecraft for a build!

To get the CSV file to input into the program, follow the steps:

- Select a schematic in Litematica's "Load Schematic" menu.
- Shift-left click on the "Write to File" button.
- Load the file from `<mcdir>\config\litematica\material_list_YYYY-MM-DD_HH.MM.SS.csv`.

## Developer Notes

The stack item definitions are stored in `itemStacks.json`. Edit this file whenever needed (e.g. a Minecraft update releases that contains an item that does not stack to 64).

To edit the amount of blocks/items that display at a time, edit the `ITEMS_PER_PAGE` variable in `index.js`.

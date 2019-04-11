import * as shell from "shelljs";

shell.cp("-f", "./package*.json", "dist/");
// Images
shell.cp("-R", "src-public/images", "dist/public/");
// Fonts
shell.mkdir("-p", "dist/public/fonts");
shell.cp("-R", "src-public/fonts/Playfair_Display", "dist/public/fonts/Playfair_Display");
shell.cp("-R", "node_modules/@fortawesome/fontawesome-free/webfonts", "dist/public/fonts/fontawesome-free");


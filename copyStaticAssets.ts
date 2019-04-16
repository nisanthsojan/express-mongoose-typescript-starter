import * as shell from "shelljs";

shell.mkdir("-p", "dist");
shell.cp("-f", "./package*.json", "dist/");
shell.cp("-f", "./Procfile", "dist/");
shell.mkdir("-p", "dist/public");
// Images
shell.cp("-rf", "src-public/images", "dist/public/images");
// Fonts
shell.mkdir("-p", "dist/public/fonts");
shell.cp("-rf", "src-public/fonts/Playfair_Display", "dist/public/fonts/Playfair_Display");
shell.cp("-rf", "node_modules/@fortawesome/fontawesome-free/webfonts", "dist/public/fonts/fontawesome-free");


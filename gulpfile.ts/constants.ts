import { resolve, join } from "path";

const BASE = resolve(__dirname, "../");

const DIST = join(BASE, "dist");
const SOURCE = {
    SERVER: join(BASE, "src-server"),
    PUBLIC: join(BASE, "src-public")
};

const DIST_PUBLIC = join(DIST, "public");

export { BASE, DIST, SOURCE, DIST_PUBLIC };

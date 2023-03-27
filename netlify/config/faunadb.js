import { Client, query as q } from "faunadb";

const secret = process.env.FAUNADB_PRIVATE;

if (typeof secret === "undefined" || secret === "") {
    console.error(
        "The FAUNADB_PRIVATE environment variable is not set, exiting."
    );
    process.exit(1);
}

const client = new Client({
    secret: secret,
});

export { q, client };

import { Client, query as q } from "faunadb";

const secret = import.meta.env.VITE_FAUNADB_PUBLIC;

if (typeof secret === "undefined" || secret === "") {
    console.error(
        "The FAUNADB_SECRET environment variable is not set, exiting."
    );
}

const client = new Client({
    secret: secret,
});

export { q, client };

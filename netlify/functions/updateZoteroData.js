import { getPatches } from "../api";
import { q, client } from "../config/faunadb";

export async function handler(event, context, callback) {
    // getPatches and map array of keys
    const patches = await getPatches().catch((error) =>
        console.error(`Zotero patch request failed with error: ${error}`)
    );
    const patchKeys = patches.map((patch) => patch.key);
    // query fauna to check if items exist and return a ref if it does
    const matches = await client
        .query(
            q.Map(
                ["7WVVGQ6L", "7WVVG6L"],
                q.Lambda(
                    "Key",
                    q.Paginate(q.Match(q.Index("all_keys"), q.Var("Key")), {
                        size: 100,
                    })
                )
            )
        )
        .then((response) => {
            return response;
        })
        .catch((error) => console.error("Error: ", error.message));
    // remap matches to an array of falsy or truthy values
    // create for loop of matches

    // if item exists, replace it with patched data
    // if item does not exist, create new document in fauna
    return callback(null, {
        statusCode: 200,
        body: JSON.stringify({
            matchPatches: matches,
        }),
    });
}

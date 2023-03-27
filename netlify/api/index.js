import { q, client } from "../config/faunadb";
import remapZoteroData from "../../src/utils/remapZoteroData";

async function getLatestVersion() {
    return client
        .query(
            q.Max(
                q.Map(
                    q.Paginate(q.Match(q.Index("all_zoteroData")), {
                        size: 10000,
                    }),
                    q.Lambda(
                        "Ref",
                        q.Select(
                            "version",
                            q.Select("data", q.Get(q.Var("Ref")))
                        )
                    )
                )
            )
        )
        .then((response) => response.data)
        .catch((error) => console.error("Error: ", error.message));
}

export const getPatches = async () => {
    const latestVersion = await getLatestVersion();
    const patchUrl = `https://api.zotero.org/groups/4433711/items?since=${latestVersion}&limit=100&format=json&v=3`;
    const response = await fetch(patchUrl, {
        headers: {
            "Zotero-API-Key": "JS6XoBPTFL0BG37rVBWS6rMR",
            "If-Modified-Since-Version": latestVersion,
        },
        cache: "default",
    });
    if (!response.ok) {
        if (response.status === 304) {
            console.log(`${new Date()}: Data already up to date`);
        } else {
            console.error(
                `Zotero patch request failed with response status: ${response.status}`
            );
        }
        return null;
    } else {
        console.log(response.headers.get("Last-Modified-Version"));
        const patches = await response.json();
        return remapZoteroData(patches);
    }
};

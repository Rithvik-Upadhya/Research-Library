import React from "react";
import "./Homepage.css";
import Resource from "./Resource";
import reactStringReplace from "react-string-replace";

function Homepage() {
    const [url, setUrl] = React.useState(
        "https://api.zotero.org/groups/4433711/items?limit=100&format=json&v=3"
    );
    const [zoteroData, setZoteroData] = React.useState(
        JSON.parse(localStorage.getItem("zoteroData")) || []
    );
    const [query, setQuery] = React.useState("");
    const [matches, setMatches] = React.useState([]);
    const [version, setVersion] = React.useState(
        localStorage.getItem("version") || 0
    );

    React.useEffect(() => {
        const fetchData = async () => {
            const response = await fetch(url, {
                headers: {
                    "Zotero-API-Key": "JS6XoBPTFL0BG37rVBWS6rMR",
                },
                cache: "default",
            });

            if (!response.ok) {
                if (response.status === 304) {
                    console.log("Data already up to date");
                } else {
                    console.error(
                        `Zotero fetch request failed with response status: ${response.status}`
                    );
                }
            } else {
                const data = await response.json();
                console.log(data, zoteroData);
                setZoteroData((prevData) => prevData.concat(data));
                setVersion(response.headers.get("last-modified-version"));
                const linkHeader = response.headers.get("link");
                const nextLink =
                    linkHeader.match(/<([^<]*)>; rel="next"/) || "";
                console.log(nextLink);
                if (nextLink) {
                    if (
                        version === 0 ||
                        version ===
                            response.headers.get("last-modified-version")
                    ) {
                        setUrl(nextLink[1]);
                    } else {
                        setZoteroData([]);
                        setUrl(
                            "https://api.zotero.org/groups/4433711/items?limit=100&format=json&v=3"
                        );
                    }
                } else {
                    localStorage.setItem("version", version);
                    localStorage.setItem(
                        "zoteroData",
                        JSON.stringify(zoteroData.concat(data))
                    );
                }
            }
        };
        if (!localStorage.getItem("zoteroData")) {
            fetchData().catch((error) =>
                console.error(
                    `Zotero fetch request failed with error: ${error}`
                )
            );
            handleQuery();
        }
    }, [url]);

    React.useEffect(() => {
        const patchUrl = `https://api.zotero.org/groups/4433711/items?since=${version}&limit=100&format=json&v=3`;
        const patchData = async () => {
            const response = await fetch(patchUrl, {
                headers: {
                    "Zotero-API-Key": "JS6XoBPTFL0BG37rVBWS6rMR",
                    "If-Modified-Since-Version": version,
                },
                cache: "default",
            });
            if (!response.ok) {
                if (response.status === 304) {
                    console.log("Data already up to date");
                } else {
                    console.error(
                        `Zotero patch request failed with response status: ${response.status}`
                    );
                }
            } else {
                setVersion(response.headers.get("Last-Modified-Version"));
                localStorage.setItem(
                    "version",
                    response.headers.get("Last-Modified-Version")
                );
                const patches = await response.json();
                const patchKeys = patches.map((patch) => patch.key);
                if (patches.length > 0) {
                    const patchedData = zoteroData.map((resource) => {
                        const index = patchKeys.indexOf(resource.key);
                        return index < 0 ? resource : patches[index];
                    });
                    setZoteroData(patchedData);
                    localStorage.setItem(
                        "zoteroData",
                        JSON.stringify(patchedData)
                    );
                }
            }
        };
        if (localStorage.getItem("version")) {
            patchData().catch((error) =>
                console.error(
                    `Zotero patch request failed with error: ${error}`
                )
            );
            handleQuery();
        }
    }, []);

    function highlight(input, regex) {
        return reactStringReplace(input, regex, (match, i) => (
            <span key={i} className="hl">
                {match}
            </span>
        ));
    }

    function handleQuery(event) {
        const queryString = event ? event.target.value : query;
        setQuery(queryString);
        const protoQuery = queryString.trim().replace(/\s+/g, "|");
        const regexQuery = new RegExp("(" + protoQuery + ")", "gi");
        const matchSet = zoteroData
            .filter((resource) => {
                return (
                    resource.data.title && resource.data.title.match(regexQuery)
                );
            })
            .sort(
                (a, b) =>
                    b.data.title.match(regexQuery).length -
                    a.data.title.match(regexQuery).length
            );
        const markedSet = matchSet.map((match) => {
            return {
                ...match,
                data: {
                    ...match.data,
                    title: highlight(match.data.title, regexQuery),
                },
            };
        });
        setMatches(markedSet);
    }
    const resources = query ? matches : zoteroData;

    const resourceEls = resources.map((resource) => {
        return <Resource {...resource.data} />;
    });

    return (
        <section id="banner">
            <div className="container">
                <h1 id="tagline">
                    A <em>library of resources</em>
                    <br />
                    on pastoralism in India
                </h1>
                {version != 0 && (
                    <input
                        type="text"
                        value={query}
                        id="query"
                        onChange={handleQuery}
                    />
                )}
                {zoteroData.length === 0 ? (
                    <div className="loading">Loading</div>
                ) : (
                    <div id="resources">{resourceEls}</div>
                )}
            </div>
        </section>
    );
}

export default Homepage;

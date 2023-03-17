import React from "react";
import "./Homepage.css";
import Resource from "./Resource";
import reactStringReplace from "react-string-replace";
import remapZoteroData from "../utils/remapZoteroData";

function Homepage() {
    if (localStorage.getItem("DataStructure") != 2) {
        localStorage.clear();
        localStorage.setItem("DataStructure", 2);
    }

    const [url, setUrl] = React.useState(
        "https://api.zotero.org/groups/4433711/items?limit=100&format=json&v=3"
    );
    const [zoteroData, setZoteroData] = React.useState(
        JSON.parse(localStorage.getItem("zoteroData")) || []
    );
    function checkboxObjects(prop, inputData) {
        const uniqueValues = [
            ...new Set(
                inputData.reduce((propsArray, resource) => {
                    return propsArray.concat(resource[prop]);
                }, [])
            ),
        ].sort();
        const checkboxObjects = uniqueValues.map((uniqueValue) => ({
            value: uniqueValue,
            checked: false,
        }));
        return checkboxObjects;
    }
    function queriesTemplate(inputData) {
        return {
            searchTerm: "",
            itemTypes: checkboxObjects("itemType", inputData),
            tags: checkboxObjects("tags", inputData),
        };
    }
    const [queries, setQueries] = React.useState(queriesTemplate(zoteroData));
    const [matches, setMatches] = React.useState([]);
    const [zoteroVersion, setZoteroVersion] = React.useState(
        localStorage.getItem("zoteroVersion") || 0
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
                const dataDump = await response.json();
                console.log(remapZoteroData(dataDump), zoteroData);
                const newZoteroData = zoteroData.concat(
                    remapZoteroData(dataDump)
                );
                setZoteroData(newZoteroData);
                setZoteroVersion(response.headers.get("last-modified-version"));
                setQueries(queriesTemplate(newZoteroData));
                const linkHeader = response.headers.get("link");
                const nextLink =
                    linkHeader.match(/(?<=<)([^<]*)(?=>; rel="next")/) || "";
                if (nextLink) {
                    if (
                        zoteroVersion === 0 ||
                        zoteroVersion ===
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
                    localStorage.setItem("zoteroVersion", zoteroVersion);
                    localStorage.setItem(
                        "zoteroData",
                        JSON.stringify(newZoteroData)
                    );
                    matchQueries(newZoteroData, queries);
                }
            }
        };
        if (!localStorage.getItem("zoteroData")) {
            fetchData().catch((error) =>
                console.error(
                    `Zotero fetch request failed with error: ${error}`
                )
            );
        }
    }, [url]);

    React.useEffect(() => {
        // Retrieves data that has changed since last
        // sync with Zotero and patces the database
        const patchUrl = `https://api.zotero.org/groups/4433711/items?since=${zoteroVersion}&limit=100&format=json&v=3`;
        const patchData = async () => {
            const response = await fetch(patchUrl, {
                headers: {
                    "Zotero-API-Key": "JS6XoBPTFL0BG37rVBWS6rMR",
                    "If-Modified-Since-Version": zoteroVersion,
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
                setZoteroVersion(response.headers.get("Last-Modified-Version"));
                localStorage.setItem(
                    "zoteroVersion",
                    response.headers.get("Last-Modified-Version")
                );
                const patches = await response.json();
                const patchKeys = patches.map((patch) => patch.key);
                const remappedPatches = remapZoteroData(patches);
                if (patches.length > 0) {
                    const patchedData = zoteroData.map((resource) => {
                        const index = patchKeys.indexOf(resource.key);
                        return index < 0 ? resource : remappedPatches[index];
                    });
                    setZoteroData(patchedData);
                    localStorage.setItem(
                        "zoteroData",
                        JSON.stringify(patchedData)
                    );
                    setQueries(queriesTemplate(patchedData));
                    matchQueries(patchedData, queries);
                }
            }
        };
        if (localStorage.getItem("zoteroVersion")) {
            patchData().catch((error) =>
                console.error(
                    `Zotero patch request failed with error: ${error}`
                )
            );
        }
    }, []);

    function createRegex(searchTerm) {
        const protoSearch = searchTerm
            .replace(/[,\s/.]+/g, " ")
            .trim()
            .replace(/\s+/g, "|")
            .replace(/\|.{1,2}(?=\||$)/g, "");
        return new RegExp(`(${protoSearch})`, "gi");
    }

    function matchQueries(dataSet, queriesSet) {
        const regexSearch = createRegex(queriesSet.searchTerm);
        function search({ title, itemType, year, tags, authors }) {
            const searchable = [
                tags.join(" "),
                title,
                itemType,
                year,
                authors.join(" "),
            ].join(" ");
            return queriesSet.searchTerm.length > 2
                ? searchable && searchable.match(regexSearch)
                : true;
        }
        function highlight(input) {
            return reactStringReplace(input, regexSearch, (match, i) => (
                <span key={i} className="hl">
                    {match}
                </span>
            ));
        }
        function checkItemType(currentItemType) {
            return queriesSet.itemTypes.some((itemType) => itemType.checked)
                ? queriesSet.itemTypes
                      .filter((itemType) => itemType.checked)
                      .map((itemType) => itemType.value)
                      .includes(currentItemType)
                : true;
        }
        function checkTags(currentTags) {
            const queriedTags = queriesSet.tags
                .filter((tag) => tag.checked)
                .map((tag) => tag.value);
            const checkTags = currentTags.some(
                (currentTag) => queriedTags.indexOf(currentTag) >= 0
            );
            return queriedTags.length > 0 ? checkTags : true;
        }
        const filtered = dataSet.filter((resource) => {
            return (
                search(resource) &&
                checkItemType(resource.itemType) &&
                checkTags(resource.tags)
            );
        });
        const sorted = filtered.sort(
            (a, b) => search(b).length - search(a).length
        );
        const markedSet = sorted.map((match) => ({
            ...match,
            title: highlight(match.title),
            itemType: highlight(match.itemType),
            year: match.year ? highlight(match.year.toString()) : undefined,
            tags: match.tags.map((tag) => highlight(tag)),
            authors: match.authors.map((author) => highlight(author)),
        }));
        queriesSet.searchTerm.length > 2
            ? setMatches(markedSet)
            : setMatches(filtered);
    }

    function handleQueries(event) {
        const { name, value, type, checked } = event.target;
        function flipChecked(prop) {
            return queries[prop].map((propObj) => ({
                value: propObj.value,
                checked: propObj.value === value ? checked : propObj.checked,
            }));
        }
        const newQueries = {
            ...queries,
            [name]: type === "checkbox" ? flipChecked(name) : value,
        };
        setQueries(newQueries);
        matchQueries(zoteroData, newQueries);
    }
    const resources =
        queries.searchTerm.length > 2 ||
        queries.itemTypes.some((itemType) => itemType.checked) ||
        queries.tags.some((tag) => tag.checked)
            ? matches
            : zoteroData;
    const resourceEls = resources.map((resource) => {
        return <Resource {...resource} id={resource.key} />;
    });

    // optional: add to make checked items appear on top
    // .sort((a, b) => (a.checked === b.checked ? 0 : a.checked ? -1 : 1))
    const itemTypeEls = queries.itemTypes.map((itemType, i) => {
        return (
            <div className="checkbox" key={i}>
                <input
                    type="checkbox"
                    id={`itemType_${i}`}
                    value={itemType.value}
                    name="itemTypes"
                    checked={queries.itemTypes[i].checked}
                    onChange={handleQueries}
                />
                <label htmlFor={`itemType_${i}`}>{itemType.value}</label>
            </div>
        );
    });

    // optional: add to make checked items appear on top
    // .sort((a, b) => (a.checked === b.checked ? 0 : a.checked ? -1 : 1))
    const tagEls = queries.tags.map((tag, i) => {
        return (
            <div className="checkbox" key={i}>
                <input
                    type="checkbox"
                    id={`tag_${i}`}
                    value={tag.value}
                    name="tags"
                    checked={queries.tags[i].checked}
                    onChange={handleQueries}
                />
                <label htmlFor={`tag_${i}`}>{tag.value}</label>
            </div>
        );
    });

    return (
        <>
            <section id="banner">
                <div className="container">
                    <h1 id="tagline">
                        A <em>library of resources</em> on pastoralism in India
                    </h1>
                    {zoteroVersion != 0 && (
                        <div id="queryContainer">
                            <div id="queryInputs">
                                <div id="searchBox">
                                    <input
                                        type="text"
                                        placeholder="Search & Filter"
                                        value={queries.searchTerm}
                                        id="searchTerm"
                                        name="searchTerm"
                                        onChange={handleQueries}
                                    />
                                </div>
                                <div id="queryOptions">
                                    <div className="checkboxesGroup">
                                        <p className="checkboxesTitle">
                                            Formats
                                        </p>
                                        <div
                                            id="itemTypes"
                                            className="checkboxes"
                                        >
                                            {itemTypeEls}
                                        </div>
                                    </div>
                                    <div className="checkboxesGroup">
                                        <p className="checkboxesTitle">
                                            Themes
                                        </p>
                                        <div id="tags" className="checkboxes">
                                            {tagEls}
                                        </div>
                                    </div>
                                    <p id="queryCount">
                                        {resources.length}{" "}
                                        {resources.length === 1
                                            ? "result"
                                            : "results"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>
            <section id="resources">
                <div className="container">
                    {zoteroData.length === 0 ? (
                        <div className="loading">Loading</div>
                    ) : (
                        <div id="resources">{resourceEls}</div>
                    )}
                </div>
            </section>
        </>
    );
}

export default Homepage;

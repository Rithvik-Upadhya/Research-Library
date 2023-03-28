import { useState, useEffect } from "react";
import "./Homepage.css";
import Resource from "./Resource";
import reactStringReplace from "react-string-replace";

function Homepage() {
    const [zoteroData, setZoteroData] = useState([]);
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
    const [queries, setQueries] = useState(queriesTemplate(zoteroData));
    const [matches, setMatches] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            const response = await fetch("/.netlify/functions/getZoteroData");
            const data = await response.json();
            data.sort(
                (a, b) => Date.parse(b.dateAdded) - Date.parse(a.dateAdded)
            );
            console.log(data);
            setZoteroData(data);
            setQueries(queriesTemplate(data));
            matchQueries(data, queriesTemplate(data));
        };
        fetchData().catch((error) =>
            console.error(
                `Getting data from server failed with error: ${error}`
            )
        );
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
                    {zoteroData.length != 0 && (
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

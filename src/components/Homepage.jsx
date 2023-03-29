import { useState, useEffect } from "react";
import "./Homepage.css";
import Resource from "./Resource";
import createQueryObj from "../utils/createQueryObj";
import reactStringReplace from "react-string-replace";
import createRegex from "../utils/createRegex";

function Homepage() {
    const [zoteroData, setZoteroData] = useState([]);
    const [favourites, setFavourites] = useState([]);
    const [queries, setQueries] = useState(createQueryObj(zoteroData));
    const [matches, setMatches] = useState([]);

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

    function matchQueries(dataSet, queryObj) {
        const regexSearch = createRegex(queryObj.searchTerm);

        function highlight(input) {
            return reactStringReplace(input, regexSearch, (match, i) => (
                <span key={i} className="hl">
                    {match}
                </span>
            ));
        }

        function search({ title, itemType, year, tags, authors }) {
            const searchable = [
                tags.join(" "),
                title,
                itemType,
                year,
                authors.join(" "),
            ].join(" ");
            return queryObj.searchTerm.length > 2
                ? searchable && searchable.match(regexSearch)
                : true;
        }

        function checkItemType(currentItemType) {
            return queryObj.itemTypes.some((itemType) => itemType.checked)
                ? queryObj.itemTypes
                      .filter((itemType) => itemType.checked)
                      .map((itemType) => itemType.value)
                      .includes(currentItemType)
                : true;
        }

        function checkItemTags(currentItemTags) {
            const queriedTags = queryObj.tags
                .filter((tag) => tag.checked)
                .map((tag) => tag.value);
            const checkTags = currentItemTags.some(
                (currentItemTag) => queriedTags.indexOf(currentItemTag) >= 0
            );
            return queriedTags.length > 0 ? checkTags : true;
        }

        const filtered = dataSet.filter((resource) => {
            return (
                search(resource, queryObj) &&
                checkItemType(resource.itemType, queryObj) &&
                checkItemTags(resource.tags, queryObj)
            );
        });

        const sorted = filtered.sort(
            (a, b) => search(b).length - search(a).length
        );

        const marked = sorted.map((match) => ({
            ...match,
            title: highlight(match.title),
            itemType: highlight(match.itemType),
            year: match.year ? highlight(match.year.toString()) : undefined,
            tags: match.tags.map((tag) => highlight(tag)),
            authors: match.authors.map((author) => highlight(author)),
        }));

        queryObj.searchTerm.length > 2
            ? setMatches(marked)
            : setMatches(filtered);
    }

    useEffect(() => {
        const fetchData = async () => {
            const response = await fetch("/.netlify/functions/getZoteroData");
            const data = await response.json();
            const favouriteData = data.filter((item) => item.favourite);
            console.log(data);
            console.log(favouriteData);
            setFavourites(favouriteData);
            setZoteroData(data);
            setQueries(createQueryObj(data));
            matchQueries(data, createQueryObj(data));
        };
        fetchData().catch((error) =>
            console.error(
                `Getting data from server failed with error: ${error}`
            )
        );
    }, []);

    const doSearch =
        queries.searchTerm.length > 2 ||
        queries.itemTypes.some((itemType) => itemType.checked) ||
        queries.tags.some((tag) => tag.checked);

    const resources = doSearch ? matches : favourites;
    const resourceCount = doSearch ? matches.length : zoteroData.length;
    const resourceEls = resources.map((resource) => {
        return <Resource {...resource} id={resource.key} />;
    });

    // optional: add to make checked items appear on top
    // .sort((a, b) => (a.checked === b.checked ? 0 : a.checked ? -1 : 1))

    function createCheckboxes(queries, categoryName) {
        // optional: add to make checked items appear on top
        // .sort((a, b) => (a.checked === b.checked ? 0 : a.checked ? -1 : 1))
        return queries[categoryName].map((categoryItem, i) => {
            return (
                <div className="checkbox" key={i}>
                    <input
                        type="checkbox"
                        id={`${categoryName}_${i}`}
                        value={categoryItem.value}
                        name={categoryName}
                        checked={categoryItem.checked}
                        onChange={handleQueries}
                    />
                    <label htmlFor={`${categoryName}_${i}`}>
                        {categoryName.value}
                    </label>
                </div>
            );
        });
    }
    const itemTypeEls = createCheckboxes(queries, "itemType");

    // queries.itemTypes.map((itemType, i) => {
    //     return (
    //         <div className="checkbox" key={i}>
    //             <input
    //                 type="checkbox"
    //                 id={`itemType_${i}`}
    //                 value={itemType.value}
    //                 name="itemTypes"
    //                 checked={queries.itemTypes[i].checked}
    //                 onChange={handleQueries}
    //             />
    //             <label htmlFor={`itemType_${i}`}>{itemType.value}</label>
    //         </div>
    //     );
    // });
    const tagEls = createCheckboxes(queries, "tags");

    // queries.tags.map((tag, i) => {
    //     return (
    //         <div className="checkbox" key={i}>
    //             <input
    //                 type="checkbox"
    //                 id={`tag_${i}`}
    //                 value={tag.value}
    //                 name="tags"
    //                 checked={queries.tags[i].checked}
    //                 onChange={handleQueries}
    //             />
    //             <label htmlFor={`tag_${i}`}>{tag.value}</label>
    //         </div>
    //     );
    // });

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
                                        {`${resourceCount} ${
                                            resourceCount === 1
                                                ? "result"
                                                : "results"
                                        }`}
                                        {}
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

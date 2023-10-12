import { useState, useEffect } from "react";
import "../assets/css/Homepage.css";
import Resource from "./Resource";
import createQueryObj from "../utils/createQueryObj";
import reactStringReplace from "react-string-replace";
import createRegex from "../utils/createRegex";
import {
	modalTrigger,
	modalBtnClose,
	modalBackdropClose,
} from "../utils/modal";

function Homepage() {
	const localDB = JSON.parse(localStorage.getItem("localDB"));
	if (!localDB) {
		localStorage.clear();
	}
	const [zoteroData, setZoteroData] = useState(
		localDB ? localDB.zoteroData : []
	);
	const [favourites, setFavourites] = useState(
		localDB ? localDB.favourites : []
	);
	const [version, setVersion] = useState(localDB ? localDB.version : 0);
	const [queries, setQueries] = useState(createQueryObj(zoteroData));
	const [matches, setMatches] = useState([]);
	const [loading, setLoading] = useState(true);

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
		let remoteDB = {
			version: version,
			zoteroData: zoteroData,
			favourites: favourites,
		};
		const fetchVersion = async () => {
			const response = await fetch("/.netlify/functions/getMongoVersion");
			const data = await response.json();
			remoteDB = {
				...remoteDB,
				version: data,
			};
			if (localDB && localDB.version != remoteDB.version) {
				fetchFavourites().catch((error) => {
					setLoading("networkError");
					console.error(
						`Getting favourites from netlify failed with error: ${error}`
					);
				});
			}
		};
		fetchVersion().catch((error) =>
			console.error(
				`Getting version from netlify failed with error: ${error}`
			)
		);
		const fetchData = async () => {
			const response = await fetch("/.netlify/functions/getZoteroData");
			const data = await response.json();
			setZoteroData(data);
			setQueries(createQueryObj(data));
			matchQueries(data, createQueryObj(data));

			remoteDB = {
				...remoteDB,
				zoteroData: data,
			};
			console.log("remoteDB", remoteDB);
			localStorage.setItem("localDB", JSON.stringify(remoteDB));
		};
		const fetchFavourites = async () => {
			const response = await fetch(
				"/.netlify/functions/getZoteroFavourites"
			);
			const data = await response.json();
			setFavourites(data);
			setZoteroData(data);
			setQueries(createQueryObj(data));
			setLoading(false);
			matchQueries(data, createQueryObj(data));

			remoteDB = {
				...remoteDB,
				favourites: data,
			};
			fetchData().catch((error) => {
				setLoading("networkError");
				console.error(
					`Getting data from netlify failed with error: ${error}`
				);
			});
		};

		if (localDB) {
			setZoteroData(localDB.zoteroData);
			setFavourites(localDB.favourites);
			setVersion(localDB.version);
			setQueries(createQueryObj(localDB.zoteroData));
			setLoading(false);
			matchQueries(
				localDB.zoteroData,
				createQueryObj(localDB.zoteroData)
			);
			console.log("localDB", localDB);
		} else {
			fetchFavourites().catch((error) => {
				setLoading("networkError");
				console.error(
					`Getting favourites from netlify failed with error: ${error}`
				);
			});
		}
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

	function createCheckboxes(querySet, categoryName) {
		// optional: add to make checked items appear on top
		// .sort((a, b) => (a.checked === b.checked ? 0 : a.checked ? -1 : 1))
		return querySet[categoryName].map((categoryItem, i) => {
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
						{categoryItem.value}
					</label>
				</div>
			);
		});
	}

	const itemTypeEls = createCheckboxes(queries, "itemTypes");

	const tagEls = createCheckboxes(queries, "tags");

	return (
		<>
			<section id="banner">
				<div className="container">
					<h1 id="tagline">
						A <em>library of resources</em> on pastoralism
					</h1>
					{zoteroData.length != 0 && (
						<>
							<div className="about__button">
								<button
									className="modalTrigger readMore"
									onClick={() => modalTrigger("about")}>
									<span className="buttonText">
										About this library
									</span>
								</button>
							</div>
							<dialog
								className="modal info"
								id="modal_about"
								onClick={(event) =>
									modalBackdropClose(event, "about")
								}>
								<h4>About this library</h4>
								<p>
									Pastoralism is a topic that hasn't received
									much attention in published works, and what
									little is available is often difficult to
									locate. This is especially true for specific
									areas such as pastoral commodity production,
									economics, mobility, language, culture, and
									politics. At CfP, we continuously review and
									catalog existing works on pastoralism within
									our in-house repository. However, we
									recognised the need to create a publicly
									accessible resource where individuals
									interested in pastoralism can easily browse
									through academic publications, audio-visual
									recordings, films, popular articles, policy
									and legal documents, and more. Whenever
									possible, we provide access to the
									publication or a link to the author or
									publisher's page. Unfortunately, we cannot
									share copies of these publications.
								</p>
								<p>
									You can start by typing a word, phrase,
									author name, or publication, and you can
									refine your search by selecting a specific
									format (book, blog post, magazine article,
									journal paper, etc.) and/or a keyword. We
									update the library as frequently as
									possible, so if your search doesn't yield
									any results, please check back later.
								</p>
								<p>
									Thanks, and welcome to the CfP’s Library of
									Resources on Pastoralism!
								</p>
								<div className="buttons">
									<div className="button">
										<button
											className="modalBtnClose"
											onClick={() =>
												modalBtnClose("about")
											}>
											Close
										</button>
									</div>
								</div>
							</dialog>
						</>
					)}
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
											className="checkboxes">
											{itemTypeEls}
										</div>
									</div>
									<div className="checkboxesGroup">
										<p className="checkboxesTitle">
											Keywords
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
					{loading === true ? (
						<div className="loading">
							<img
								src="/images/loading.svg"
								className="loading__icon"
								alt=""
							/>
							<span className="loading__text">
								Fetching resources,
								<br /> hold on to your papers!
							</span>
						</div>
					) : loading === false ? (
						<>{resourceEls}</>
					) : (
						<div className="loading">
							Oops! Something went wrong. <br />
							Please reload or try again later.
						</div>
					)}
					<a
						href="#"
						title="Scroll to top"
						aria-label="Scroll to top"
						className="scrollToTop"></a>
				</div>
			</section>
		</>
	);
}

export default Homepage;

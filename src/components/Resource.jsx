import React from "react";
import "./Resource.css";

export default function Resource(props) {
    const publicationInfo = [
        props.websiteTitle,
        props.institution,
        props.publisher,
        props.series,
        props.volume ? `Vol. ${props.volume}` : "",
        props.edition ? `No. ${props.edition}` : "",
        props.pages ? `p. ${props.pages}` : "",
    ]
        .filter(Boolean)
        .join(", ");
    const tagEls = props.tags.map((tag, i) => (
        <span className="tag" key={i}>
            {tag}
        </span>
    ));
    const authorEls = props.authors.map((author, i, authors) => (
        <span className="author" key={i}>
            {author}
            {i < authors.length - 1 ? ", " : ""}
        </span>
    ));
    return (
        <div className="resource">
            <p className="type">
                {props.itemType}
                {props.year ? " | " : ""}
                {props.year ? props.year : ""}
            </p>
            <p className="title">{props.title}</p>
            {props.authors.length > 0 && (
                <p className="authors">
                    {props.authors.length > 1 ? "Authors: " : "Author: "}
                    {authorEls}
                </p>
            )}
            {publicationInfo && (
                <p className="publication">{publicationInfo}</p>
            )}
            {props.abstractNote && (
                <p className="abstract">
                    {props.abstractNote.length > 450
                        ? `${props.abstractNote.substring(0, 450)}...`
                        : props.abstractNote}
                </p>
            )}
            {props.url && (
                <div className="button">
                    <a href={props.url} target="_blank">
                        Access
                    </a>
                </div>
            )}
            {tagEls.length > 0 && <div className="tags">{tagEls}</div>}
        </div>
    );
}

import React from "react";
import "./Resource.css";

export default function Resource(props) {
    const authors = props.creators
        ? props.creators.map(
              (author) => `${author.firstName} ${author.lastName}`
          )
        : [];
    const camelCaseToWords = (str) => {
        return str
            .match(/^[a-z]+|[A-Z][a-z]*/g)
            .map(function (word) {
                return word[0].toUpperCase() + word.substr(1).toLowerCase();
            })
            .join(" ");
    };
    const publicationInfo = [
        props.websiteTitle,
        props.institution,
        props.publisher,
        props.series,
        props.seriesNumber,
        props.volume ? `Vol. ${props.volume}` : "",
        props.edition ? `No. ${props.edition}` : "",
        props.pages ? `p. ${props.pages}` : "",
    ]
        .filter(Boolean)
        .join(", ");
    const tagEls = props.tags.map((tag) => (
        <span className="tag" key={tag.tag}>
            {tag.tag}
        </span>
    ));
    return (
        <div className="resource">
            <p className="type">{camelCaseToWords(props.itemType)}</p>
            <p className="title">{props.title}</p>
            {authors.length > 0 && (
                <p className="authors">
                    {authors.length > 1 ? "Authors:" : "Author:"}{" "}
                    {authors.join(", ")}
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

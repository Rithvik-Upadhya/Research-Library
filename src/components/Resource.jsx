import React from "react";
import "../assets/css/Resource.css";
import cloudinarifyImage from "../utils/cloudinarifyImage";
import {
	modalTrigger,
	modalBtnClose,
	modalBackdropClose,
} from "../utils/modal";

export default function Resource(props) {
	const publicationInfo = [
		props.websiteTitle ? (
			<span>
				<b>Website:</b> {props.websiteTitle}
				<br />
			</span>
		) : (
			""
		),
		props.institution ? (
			<span>
				<b>Institution:</b> {props.institution}
				<br />
			</span>
		) : (
			""
		),
		props.publisher ? (
			<span>
				<b>Publisher:</b> {props.publisher}
				<br />
			</span>
		) : (
			""
		),
		props.series ? (
			<span>
				<b>Series:</b> {props.series}
				<br />
			</span>
		) : (
			""
		),
		props.volume ? (
			<span>
				<b>Volume:</b> {props.volume}
				<br />
			</span>
		) : (
			""
		),
		props.edition ? (
			<span>
				<b>Edition:</b> {props.edition}
				<br />
			</span>
		) : (
			""
		),
		props.pages ? (
			<span>
				<b>Pages:</b> {props.pages}
				<br />
			</span>
		) : (
			""
		),
	]
		.filter(Boolean)
		.map((info, i, infos) => (
			<span className="pubInfo" key={i}>
				{info}
			</span>
		));
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
		<div className="resource" id={props.id}>
			{props.image && (
				<img
					className="resource-image"
					src={cloudinarifyImage(props.image, "c_fill,w_500,h_500")}
					alt={props.alt}
				/>
			)}
			<div className="resource-info">
				<p className="flag">
					{props.itemType}
					{props.year ? " | " : ""}
					{props.year ? props.year : ""}
				</p>
				{props.title && (
					<p className="title">
						{props.title.length > 150
							? `${props.title.substring(0, 150)}...`
							: props.title}
					</p>
				)}
				<dialog
					className="modal info"
					id={`modal_${props.id}`}
					onClick={(event) => modalBackdropClose(event, props.id)}>
					<p className="flag">
						{props.itemType}
						{props.year ? " | " : ""}
						{props.year ? props.year : ""}
					</p>
					<p className="title">{props.title}</p>
					<p className="publication">{publicationInfo}</p>
					{props.authors.length > 0 && (
						<p className="authors">
							{props.authors.length > 1
								? "Authors: "
								: "Author: "}
							{authorEls}
						</p>
					)}
					{props.abstractNote && (
						<p className="abstract">{props.abstractNote}</p>
					)}
					<div className="buttons">
						<div className="button">
							<button
								className="modalBtnClose"
								onClick={() => modalBtnClose(props.id)}>
								Close
							</button>
						</div>
						{props.url && (
							<div className="button">
								<a href={props.url} target="_blank">
									Access
								</a>
							</div>
						)}
					</div>
				</dialog>
				{props.authors.length > 0 && (
					<p className="authors">
						{props.authors.length > 1 ? "Authors: " : "Author: "}
						{authorEls}
					</p>
				)}
				{props.abstractNote && !props.image && (
					<p className="abstract">
						{props.abstractNote.length > 200
							? `${props.abstractNote.substring(0, 200)}...`
							: props.abstractNote}
					</p>
				)}
				<button
					className="modalTrigger readMore"
					onClick={() => modalTrigger(props.id)}>
					<span className="buttonText">Read More</span>
				</button>
				{tagEls.length > 0 && <div className="tags">{tagEls}</div>}
			</div>
		</div>
	);
}

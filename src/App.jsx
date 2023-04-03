import React from "react";
import Header from "./components/Header";
import Homepage from "./components/Homepage";
import useScript from "./hooks/useScript";
import "./assets/css/index.css";

function App() {
	useScript("/js/index.js");
	return (
		<>
			<Header />
			<main id="content">
				<Homepage />
			</main>
		</>
	);
}

export default App;

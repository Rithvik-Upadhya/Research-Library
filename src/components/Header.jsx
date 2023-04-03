import React from "react";

function Header() {
	return (
		<header>
			<div className="container" id="header">
				<div className="header-left">
					<a href="" aria-label="Load Homepage">
						<img src="images/logo.svg" id="logo" alt="" />
					</a>
				</div>
				<div className="header-centre">
					<nav></nav>
				</div>
				<div className="header-right"></div>
			</div>
		</header>
	);
}

export default Header;
